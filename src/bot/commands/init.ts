import {
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { registerProject } from "../../db/database.js";
import { validateProjectPath } from "../../security/guard.js";
import { getConfig } from "../../utils/config.js";
import { L } from "../../utils/i18n.js";

export const data = new SlashCommandBuilder()
  .setName("register")
  .setDescription(
    L(
      "Create a new channel and register it to a project directory",
      "새 채널을 만들고 프로젝트 디렉토리에 등록합니다",
    ),
  )
  .addStringOption((opt) =>
    opt
      .setName("path")
      .setDescription(`Project folder name (${getConfig().BASE_PROJECT_DIR})`)
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
  const input = interaction.options.getString("path", true);
  const config = getConfig();
  const projectPath = path.isAbsolute(input)
    ? input
    : path.join(config.BASE_PROJECT_DIR, input);
  const guildId = interaction.guildId!;
  const guild = interaction.guild!;

  // Create directory if it doesn't exist
  if (!fs.existsSync(projectPath)) {
    const resolved = path.resolve(projectPath);
    const baseDir = path.resolve(config.BASE_PROJECT_DIR);
    if (!resolved.startsWith(baseDir + path.sep) && resolved !== baseDir) {
      await interaction.editReply({
        content: L(
          `Invalid path: Path must be within ${baseDir}`,
          `잘못된 경로: ${baseDir} 내에 있어야 합니다`,
        ),
      });
      return;
    }
    if (projectPath.includes("..")) {
      await interaction.editReply({
        content: L(
          "Invalid path: Path must not contain '..'",
          "잘못된 경로: '..'을 포함할 수 없습니다",
        ),
      });
      return;
    }
    fs.mkdirSync(projectPath, { recursive: true });
  }

  // Validate path
  const error = validateProjectPath(projectPath);
  if (error) {
    await interaction.editReply({
      content: L(`Invalid path: ${error}`, `잘못된 경로: ${error}`),
    });
    return;
  }

  // Derive channel name from folder name
  const channelName = path.basename(projectPath).toLowerCase().replace(/[^a-z0-9-]/g, "-");

  // Create Discord channel
  const category = interaction.options.getChannel("category");
  const newChannel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    topic: `Claude Code — ${projectPath}`,
    reason: `Init project: ${projectPath}`,
    ...(category ? { parent: category.id } : {}),
  });

  // Register in database
  registerProject(newChannel.id, projectPath, guildId);

  await interaction.editReply({
    embeds: [
      {
        title: L("Project Initialized", "프로젝트 초기화됨"),
        description: L(
          `Created <#${newChannel.id}> and linked to:\n\`${projectPath}\``,
          `<#${newChannel.id}> 채널을 생성하고 연결했습니다:\n\`${projectPath}\``,
        ),
        color: 0x00ff00,
        fields: [
          { name: L("Status", "상태"), value: L("🔴 Offline", "🔴 오프라인"), inline: true },
          { name: L("Auto-approve", "자동 승인"), value: L("Off", "꺼짐"), inline: true },
        ],
      },
    ],
  });
}

export async function autocomplete(
  interaction: AutocompleteInteraction,
): Promise<void> {
  const focused = interaction.options.getFocused();
  const config = getConfig();
  const baseDir = config.BASE_PROJECT_DIR;

  try {
    const entries = fs.readdirSync(baseDir, { withFileTypes: true });
    const dirs = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith("."))
      .map((e) => e.name)
      .filter((name) => name.toLowerCase().includes(focused.toLowerCase()))
      .slice(0, 24);

    const choices: { name: string; value: string }[] = dirs.map((name) => ({
      name,
      value: name,
    }));

    // If user typed something that doesn't match any existing dir, offer to create it
    if (focused && !dirs.some((d) => d.toLowerCase() === focused.toLowerCase())) {
      choices.push({ name: `📁 Create new: ${focused}`, value: focused });
    }

    await interaction.respond(choices.slice(0, 25));
  } catch {
    await interaction.respond([]);
  }
}
