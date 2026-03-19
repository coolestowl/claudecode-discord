import {
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  TextChannel,
} from "discord.js";
import { execFile as execFileCb, exec as execCb } from "node:child_process";
import { promisify } from "node:util";
import { registerProject, setWorkspaceName } from "../../db/database.js";
import { getConfig } from "../../utils/config.js";
import {
  s_initDescription,
  s_categoryOption,
  s_invalidName,
  s_templateRequired,
  s_workspaceExists,
  s_creatingWorkspace,
  s_workspaceCreated,
  s_syncingCredentials,
  s_syncFailed,
  s_workspaceRegistered,
  s_linkedExistingWorkspace,
  s_createdAndLinkedWorkspace,
  s_status,
  s_autoApproveLabel,
  s_off,
  s_registrationFailed,
} from "../../i18n/strings.js";

const execFile = promisify(execFileCb);
const exec = promisify(execCb);

export const data = new SlashCommandBuilder()
  .setName("register")
  .setDescription(
    s_initDescription(),
  )
  .addStringOption((opt) =>
    opt
      .setName("workspace")
      .setDescription("Workspace name — pick an existing one or type a new name to create it")
      .setRequired(true)
      .setAutocomplete(true),
  )
  .addStringOption((opt) =>
    opt
      .setName("template")
      .setDescription("Coder template to use (required only when creating a new workspace)")
      .setRequired(false)
      .setAutocomplete(true),
  )
  .addChannelOption((opt) =>
    opt
      .setName("category")
      .setDescription(s_categoryOption())
      .setRequired(false)
      .addChannelTypes(ChannelType.GuildCategory),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const config = getConfig();
  const nameInput = interaction.options.getString("workspace", true);
  const template = interaction.options.getString("template");
  const guildId = interaction.guildId!;
  const guild = interaction.guild!;

  // Sanitise: lowercase, replace non-alphanumeric/hyphen chars, strip leading/trailing hyphens
  const workspaceName = nameInput
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!workspaceName) {
    await interaction.editReply({
      content: s_invalidName(),
    });
    return;
  }

  const remotePath = config.CODER_REMOTE_HOME;
  const sshHost = `${workspaceName}${config.CODER_SSH_SUFFIX}`;

  // Check if workspace already exists
  let workspaceExists = false;
  try {
    await execFile("coder", ["show", workspaceName], { timeout: 30_000 });
    workspaceExists = true;
  } catch {
    workspaceExists = false;
  }

  // If workspace does not exist, template is required
  if (!workspaceExists && !template) {
    await interaction.editReply({
      content: s_templateRequired(),
    });
    return;
  }

  let workspaceCreated = false;
  let newChannel: TextChannel | null = null;

  try {
    if (workspaceExists) {
      // Workspace already exists — skip creation and wait
      await interaction.editReply({
        content: s_workspaceExists(workspaceName),
      });
    } else {
      // Inform the user that workspace creation may take a moment
      await interaction.editReply({
        content: s_creatingWorkspace(workspaceName),
      });

      // 1. Create Coder workspace
      const paramArgs = config.CODER_CREATE_PARAMETERS
        ? ["--parameter", config.CODER_CREATE_PARAMETERS]
        : [];
      const { stdout, stderr } = await execFile(
        "coder",
        ["create", workspaceName, "--template", template!, "--yes", ...paramArgs],
        { timeout: 5 * 60 * 1000 },
      );
      if (stdout) console.log(`[coder create] ${stdout}`);
      if (stderr) console.log(`[coder create stderr] ${stderr}`);
      workspaceCreated = true;

      // 2. Notify Discord that workspace is created, waiting for initialization
      await interaction.editReply({
        content: s_workspaceCreated(workspaceName),
      });

      await new Promise((r) => setTimeout(r, 2 * 60 * 1000));

      // 3. Sync Claude credentials from config workspace (if configured)
      if (config.CODER_CONFIG_WORKSPACE) {
        const configHost = `${config.CODER_CONFIG_WORKSPACE}${config.CODER_SSH_SUFFIX}`;
        await interaction.editReply({
          content: s_syncingCredentials(config.CODER_CONFIG_WORKSPACE),
        });
        try {
          // Stream a tarball of .claude.json + .claude/ from the config workspace
          // directly into the new workspace via the local machine as relay.
          await exec(
            `ssh ${configHost} "tar -czf - -C /home/coder .claude.json .claude 2>/dev/null" | ssh ${sshHost} "cd /home/coder && rm -f .claude.json && rm -rf .claude && tar -xzf -"`,
            { timeout: 60_000 },
          );
          console.log(`[register] Claude credentials synced from ${configHost} → ${sshHost}`);
        } catch (syncErr) {
          // Non-fatal: log and continue so the workspace is still registered
          console.error(`[register] Credential sync failed: ${(syncErr as Error).message}`);
          await interaction.editReply({
            content: s_syncFailed((syncErr as Error).message),
          });
        }
      }
    }

    // 3. Create Discord channel
    const category = interaction.options.getChannel("category");
    const uniqueSuffix = Math.random().toString(36).slice(2, 6);
    const channelName = `${workspaceName}-${uniqueSuffix}`;
    newChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      topic: `Claude Code — ${workspaceName} (${remotePath})`,
      reason: `Coder workspace: ${workspaceName}`,
      ...(category ? { parent: category.id } : {}),
    }) as TextChannel;

    // 4. Register in database
    registerProject(newChannel.id, remotePath, guildId);
    setWorkspaceName(newChannel.id, workspaceName);

    await interaction.editReply({
      content: "",
      embeds: [
        {
          title: s_workspaceRegistered(),
          description: workspaceExists
            ? s_linkedExistingWorkspace(workspaceName, newChannel.id)
            : s_createdAndLinkedWorkspace(workspaceName, newChannel.id),
          color: 0x00ff00,
          fields: [
            { name: "Workspace", value: `\`${workspaceName}\``, inline: true },
            { name: "SSH host", value: `\`${sshHost}\``, inline: true },
            { name: "Remote path", value: `\`${remotePath}\``, inline: true },
            { name: s_status(), value: "🔴 Offline", inline: true },
            { name: s_autoApproveLabel(), value: s_off(), inline: true },
          ],
        },
      ],
    });
  } catch (err) {
    console.error("[register] Error:", err);

    // Rollback: delete workspace if we just created it, and delete channel if partially created
    if (workspaceCreated) {
      execFile("coder", ["delete", workspaceName, "--yes"]).catch((e) =>
        console.error(`[register] Failed to rollback workspace: ${e.message}`),
      );
    }
    if (newChannel) {
      newChannel.delete("Rollback: registration failed").catch(() => {});
    }

    await interaction.editReply({
      content: s_registrationFailed((err as Error).message),
    });
  }
}

export async function autocomplete(
  interaction: AutocompleteInteraction,
): Promise<void> {
  const focused = interaction.options.getFocused(true);

  if (focused.name === "workspace") {
    try {
      const { stdout } = await execFile("coder", ["list", "--output", "json", "--search", "owner:me"], {
        timeout: 10_000,
      });
      const rows = JSON.parse(stdout) as Array<
        { Workspace?: { name: string }; name?: string }
      >;
      const query = focused.value.toLowerCase();
      const choices = rows
        .map((r) => r.Workspace?.name ?? r.name)
        .filter((n): n is string => typeof n === "string")
        .filter((n) => n.toLowerCase().includes(query))
        .slice(0, 25)
        .map((n) => ({ name: n, value: n }));
      // If the typed value doesn't match any existing workspace, surface it as a
      // "create new" option so the user knows typing a new name is valid.
      if (
        focused.value.trim() &&
        !choices.some((c) => c.value === focused.value.trim())
      ) {
        choices.unshift({ name: `✨ Create new: "${focused.value.trim()}"`, value: focused.value.trim() });
      }
      await interaction.respond(choices.slice(0, 25));
    } catch {
      await interaction.respond([]);
    }
    return;
  }

  if (focused.name === "template") {
    try {
      const { stdout } = await execFile("coder", ["templates", "list", "--output", "json"], {
        timeout: 10_000,
      });
      const templates = JSON.parse(stdout) as { Template: { name: string; display_name?: string } }[];
      const query = focused.value.toLowerCase();
      const choices = templates
        .map((t) => t.Template)
        .filter((t) => t.name.toLowerCase().includes(query) || (t.display_name ?? "").toLowerCase().includes(query))
        .slice(0, 25)
        .map((t) => ({ name: t.display_name ? `${t.display_name} (${t.name})` : t.name, value: t.name }));
      await interaction.respond(choices);
    } catch {
      await interaction.respond([]);
    }
    return;
  }

  await interaction.respond([]);
}
