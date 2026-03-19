import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import { getAllProjects, getSession } from "../../db/database.js";
import { s_noProjectsRegistered, s_claudeCodeSessions, s_workspace, s_status, s_autoApproveLabel, s_on, s_off, s_authModeLabel, s_apiKey, s_subscription, s_model, s_defaultValue, s_lastActivity } from "../../i18n/strings.js";

const STATUS_EMOJI: Record<string, string> = {
  online: "🟢",
  waiting: "🟡",
  idle: "⚪",
  offline: "🔴",
};

export const data = new SlashCommandBuilder()
  .setName("status")
  .setDescription("Show status of all registered project sessions");

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const guildId = interaction.guildId!;
  const projects = getAllProjects(guildId);

  if (projects.length === 0) {
    await interaction.editReply({
      content: s_noProjectsRegistered(),
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(s_claudeCodeSessions())
    .setColor(0x7c3aed)
    .setTimestamp();

  for (const project of projects) {
    const session = getSession(project.channel_id);
    const status = session?.status ?? "offline";
    const emoji = STATUS_EMOJI[status] ?? "🔴";
    const lastActivity = session?.last_activity ?? "never";

    embed.addFields({
      name: `${emoji} <#${project.channel_id}>`,
      value: [
        `\`${project.project_path}\``,
        project.workspace_name ? `${s_workspace()}: \`${project.workspace_name}\`` : null,
        `${s_status()}: **${status}**`,
        `${s_autoApproveLabel()}: ${project.auto_approve ? s_on() : s_off()}`,
        `${s_authModeLabel()}: ${project.auth_mode === "api_key" ? s_apiKey() : s_subscription()}`,
        `${s_model()}: ${project.model ? `\`${project.model}\`` : s_defaultValue()}`,
        `${s_lastActivity()}: ${lastActivity}`,
      ].filter(Boolean).join("\n"),
      inline: false,
    });
  }

  await interaction.editReply({ embeds: [embed] });
}
