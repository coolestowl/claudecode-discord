import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import type { AuthMode } from "../../db/types.js";
import { getProject, setAuthMode } from "../../db/database.js";
import { L } from "../../utils/i18n.js";

export const data = new SlashCommandBuilder()
  .setName("auth-mode")
  .setDescription("Set the authentication mode for Claude in this channel")
  .addStringOption((opt) =>
    opt
      .setName("mode")
      .setDescription("subscription (Claude login) or api_key (API key / custom endpoint)")
      .setRequired(true)
      .addChoices(
        { name: "subscription", value: "subscription" },
        { name: "api_key", value: "api_key" },
      ),
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const channelId = interaction.channelId;
  const mode = interaction.options.getString("mode", true) as AuthMode;
  const project = getProject(channelId);

  if (!project) {
    await interaction.editReply({
      content: L(
        "This channel is not registered to any project.",
        "이 채널은 어떤 프로젝트에도 등록되어 있지 않습니다.",
      ),
    });
    return;
  }

  setAuthMode(channelId, mode);

  const isApiKey = mode === "api_key";
  await interaction.editReply({
    embeds: [
      {
        title: L(
          `Auth mode: ${isApiKey ? "API Key" : "Subscription"}`,
          `인증 모드: ${isApiKey ? "API 키" : "구독"}`,
        ),
        description: isApiKey
          ? L(
              "Claude will use the API key environment variables (ANTHROPIC_AUTH_TOKEN, ANTHROPIC_BASE_URL, etc.) from the .env file.",
              "Claude가 .env 파일의 API 키 환경 변수(ANTHROPIC_AUTH_TOKEN, ANTHROPIC_BASE_URL 등)를 사용합니다.",
            )
          : L(
              "Claude will use your subscription login. API key environment variables will be excluded.",
              "Claude가 구독 로그인을 사용합니다. API 키 환경 변수는 제외됩니다.",
            ),
        color: isApiKey ? 0x5865f2 : 0x00b0f4,
      },
    ],
  });
}
