import {
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  TextChannel,
} from "discord.js";
import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";
import { registerProject, setWorkspaceName } from "../../db/database.js";
import { getConfig } from "../../utils/config.js";
import { L } from "../../utils/i18n.js";

const execFile = promisify(execFileCb);

export const data = new SlashCommandBuilder()
  .setName("register")
  .setDescription(
    L(
      "Create a Coder workspace + Discord channel and register it",
      "Coder 워크스페이스와 Discord 채널을 생성하고 등록합니다",
    ),
  )
  .addStringOption((opt) =>
    opt
      .setName("name")
      .setDescription("Workspace / project name")
      .setRequired(true),
  )
  .addStringOption((opt) =>
    opt
      .setName("template")
      .setDescription("Coder template to use for the workspace")
      .setRequired(true)
      .setAutocomplete(true),
  )
  .addChannelOption((opt) =>
    opt
      .setName("category")
      .setDescription(L("Category to create the channel in", "채널을 생성할 카테고리"))
      .setRequired(false)
      .addChannelTypes(ChannelType.GuildCategory),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const config = getConfig();
  const nameInput = interaction.options.getString("name", true);
  const template = interaction.options.getString("template", true);
  const guildId = interaction.guildId!;
  const guild = interaction.guild!;

  // Sanitise: lowercase, replace non-alphanumeric/hyphen chars, strip leading/trailing hyphens
  const workspaceName = nameInput
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!workspaceName) {
    await interaction.editReply({
      content: L("Invalid name: must contain at least one alphanumeric character.", "잘못된 이름입니다."),
    });
    return;
  }

  const remotePath = `${config.CODER_REMOTE_HOME}/${workspaceName}`;
  const sshHost = `${workspaceName}${config.CODER_SSH_SUFFIX}`;

  // Inform the user that workspace creation may take a moment
  await interaction.editReply({
    content: L(`⏳ Creating Coder workspace \`${workspaceName}\`...`, `⏳ Coder 워크스페이스 \`${workspaceName}\` 생성 중...`),
  });

  let workspaceCreated = false;
  let newChannel: TextChannel | null = null;

  try {
    // 1. Create Coder workspace
    const paramArgs = config.CODER_CREATE_PARAMETERS
      ? ["--parameter", config.CODER_CREATE_PARAMETERS]
      : [];
    const { stdout, stderr } = await execFile(
      "coder",
      ["create", workspaceName, "--template", template, "--yes", ...paramArgs],
      { timeout: 5 * 60 * 1000 },
    );
    if (stdout) console.log(`[coder create] ${stdout}`);
    if (stderr) console.log(`[coder create stderr] ${stderr}`);
    workspaceCreated = true;

    // 2. Create remote project directory
    await execFile("ssh", [
      "-o", "StrictHostKeyChecking=no",
      "-o", "BatchMode=yes",
      sshHost,
      "mkdir", "-p", remotePath,
    ], { timeout: 30_000 });

    // 3. Create Discord channel
    const category = interaction.options.getChannel("category");
    const channelName = workspaceName;
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
          title: L("✅ Workspace Registered", "✅ 워크스페이스 등록됨"),
          description: L(
            `Created Coder workspace \`${workspaceName}\` and linked to <#${newChannel.id}>.`,
            `Coder 워크스페이스 \`${workspaceName}\`를 생성하고 <#${newChannel.id}>에 연결했습니다.`,
          ),
          color: 0x00ff00,
          fields: [
            { name: "Workspace", value: `\`${workspaceName}\``, inline: true },
            { name: "SSH host", value: `\`${sshHost}\``, inline: true },
            { name: "Remote path", value: `\`${remotePath}\``, inline: true },
            { name: L("Status", "상태"), value: "🔴 Offline", inline: true },
            { name: L("Auto-approve", "자동 승인"), value: L("Off", "꺼짐"), inline: true },
          ],
        },
      ],
    });
  } catch (err) {
    console.error("[register] Error:", err);

    // Rollback: delete workspace and channel if partially created
    if (workspaceCreated) {
      execFile("coder", ["delete", workspaceName, "--yes"]).catch((e) =>
        console.error(`[register] Failed to rollback workspace: ${e.message}`),
      );
    }
    if (newChannel) {
      newChannel.delete("Rollback: registration failed").catch(() => {});
    }

    await interaction.editReply({
      content: L(
        `❌ Registration failed: ${(err as Error).message}`,
        `❌ 등록 실패: ${(err as Error).message}`,
      ),
    });
  }
}

export async function autocomplete(
  interaction: AutocompleteInteraction,
): Promise<void> {
  const focused = interaction.options.getFocused(true);

  if (focused.name !== "template") {
    await interaction.respond([]);
    return;
  }

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
}
