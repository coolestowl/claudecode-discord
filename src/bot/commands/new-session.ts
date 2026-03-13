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
import { L } from "../../utils/i18n.js";

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
      content: L(
        "This channel is not registered to any project. Use `/register` first.",
        "이 채널은 어떤 프로젝트에도 등록되어 있지 않습니다. 먼저 `/register`를 사용하세요.",
      ),
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
        title: L("New Session Started", "새 세션 시작됨"),
        description: L(
          `Fresh session created for \`${project_path}\`.\nPrevious conversation history has been cleared.`,
          `\`${project_path}\`의 새 세션이 생성되었습니다.\n이전 대화 기록이 초기화되었습니다.`,
        ),
        color: 0x7c3aed,
        fields: [
          {
            name: L("Auth mode", "인증 모드"),
            value: auth_mode === "api_key" ? L("API Key", "API 키") : L("Subscription", "구독"),
            inline: true,
          },
          {
            name: L("Auto-approve", "자동 승인"),
            value: auto_approve ? L("On", "켜짐") : L("Off", "꺼짐"),
            inline: true,
          },
        ],
      },
    ],
  });
}
