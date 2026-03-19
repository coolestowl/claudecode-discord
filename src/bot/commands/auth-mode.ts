import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import type { AuthMode } from "../../db/types.js";
import { getProject, setAuthMode } from "../../db/database.js";
import {
  s_channelNotRegProject,
  s_authMode,
  s_authModeApiKeyDesc,
  s_authModeSubscriptionDesc,
} from "../../i18n/strings.js";

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
      content: s_channelNotRegProject(),
    });
    return;
  }

  setAuthMode(channelId, mode);

  const isApiKey = mode === "api_key";
  await interaction.editReply({
    embeds: [
      {
        title: s_authMode(isApiKey),
        description: isApiKey
          ? s_authModeApiKeyDesc()
          : s_authModeSubscriptionDesc(),
        color: isApiKey ? 0x5865f2 : 0x00b0f4,
      },
    ],
  });
}
