import {
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { exec as execCb, execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";
import { getProject } from "../../db/database.js";
import { getConfig } from "../../utils/config.js";
import {
  s_channelNotReg,
  s_syncingCredentials,
  s_syncFailed,
  s_syncConfigDescription,
  s_syncConfigNoConfigWorkspace,
  s_syncConfigSuccess,
  s_syncConfigWorkspaceOptionDescription,
} from "../../i18n/strings.js";

const exec = promisify(execCb);
const execFile = promisify(execFileCb);

export const data = new SlashCommandBuilder()
  .setName("sync-config")
  .setDescription(s_syncConfigDescription())
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addStringOption((option) =>
    option
      .setName("workspace")
      .setDescription(s_syncConfigWorkspaceOptionDescription())
      .setRequired(false)
      .setAutocomplete(true),
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const config = getConfig();
  const channelId = interaction.channelId;

  const project = getProject(channelId);
  if (!project) {
    await interaction.editReply({ content: s_channelNotReg() });
    return;
  }

  // Use the workspace specified by the user, or fall back to the env-configured default
  const configWorkspace =
    interaction.options.getString("workspace") ?? config.CODER_CONFIG_WORKSPACE;

  if (!configWorkspace) {
    await interaction.editReply({ content: s_syncConfigNoConfigWorkspace() });
    return;
  }

  const configHost = `${configWorkspace}${config.CODER_SSH_SUFFIX}`;

  await interaction.editReply({
    content: s_syncingCredentials(configWorkspace),
  });

  try {
    let syncCmd: string;

    if (project.workspace_name) {
      // Remote workspace: relay the tarball over SSH through this bot host
      const sshHost = `${project.workspace_name}${config.CODER_SSH_SUFFIX}`;
      syncCmd = `ssh ${configHost} "tar -czf - -C /home/coder .claude.json .claude 2>/dev/null" | ssh ${sshHost} "cd /home/coder && rm -f .claude.json && rm -rf .claude && tar -xzf -"`;
    } else {
      // Local workspace: extract directly on this machine
      const localHome = config.CODER_REMOTE_HOME;
      syncCmd = `ssh ${configHost} "tar -czf - -C /home/coder .claude.json .claude 2>/dev/null" | (cd ${localHome} && rm -f .claude.json && rm -rf .claude && tar -xzf -)`;
    }

    await exec(syncCmd, { timeout: 60_000 });

    const target = project.workspace_name ?? "local";
    console.log(`[sync-config] Claude config synced: ${configHost} → ${target}`);

    await interaction.editReply({
      content: s_syncConfigSuccess(configWorkspace, target),
    });
  } catch (err) {
    console.error(`[sync-config] Sync failed: ${(err as Error).message}`);
    await interaction.editReply({
      content: s_syncFailed((err as Error).message),
    });
  }
}

export async function autocomplete(
  interaction: AutocompleteInteraction,
): Promise<void> {
  const focused = interaction.options.getFocused(true);

  if (focused.name === "workspace") {
    try {
      const { stdout } = await execFile(
        "coder",
        ["list", "--output", "json", "--search", "owner:me"],
        { timeout: 10_000 },
      );
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
      await interaction.respond(choices);
    } catch {
      await interaction.respond([]);
    }
    return;
  }

  await interaction.respond([]);
}
