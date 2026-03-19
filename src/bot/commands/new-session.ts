import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";
import {
  getProject,
  unregisterProject,
  registerProject,
  setAutoApprove,
  setAuthMode,
} from "../../db/database.js";
import { sessionManager } from "../../claude/session-manager.js";
import {
  s_channelNotRegProject,
  s_newSessionStarted,
  s_newSessionDesc,
  s_authModeLabel,
  s_apiKey,
  s_subscription,
  s_autoApproveLabel,
  s_on,
  s_off,
} from "../../i18n/strings.js";

export const data = new SlashCommandBuilder()
  .setName("new-session")
  .setDescription("Discard the current session and start a fresh one for this channel")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const channelId = interaction.channelId;
  const project = getProject(channelId);

  if (!project) {
    await interaction.editReply({
      content: s_channelNotRegProject(),
    });
    return;
  }

  // Snapshot current settings before wiping
  const { project_path, guild_id, auto_approve, auth_mode } = project;

  // Stop active session if any
  await sessionManager.stopSession(channelId);

  // Wipe project + session records
  unregisterProject(channelId);

  // Re-register with the same path, restoring saved settings
  registerProject(channelId, project_path, guild_id);
  if (auto_approve) setAutoApprove(channelId, true);
  setAuthMode(channelId, auth_mode);

  await interaction.editReply({
    embeds: [
      {
        title: s_newSessionStarted(),
        description: s_newSessionDesc(project_path),
        color: 0x7c3aed,
        fields: [
          {
            name: s_authModeLabel(),
            value: auth_mode === "api_key" ? s_apiKey() : s_subscription(),
            inline: true,
          },
          {
            name: s_autoApproveLabel(),
            value: auto_approve ? s_on() : s_off(),
            inline: true,
          },
        ],
      },
    ],
  });
}
