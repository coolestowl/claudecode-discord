import {
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { getProject, setModel } from "../../db/database.js";
import { getConfig, getApiKeyModels } from "../../utils/config.js";
import { L } from "../../utils/i18n.js";

export const data = new SlashCommandBuilder()
  .setName("model")
  .setDescription(L("Set the Claude model for this channel", "이 채널의 Claude 모델을 설정합니다"))
  .addStringOption((opt) =>
    opt
      .setName("model")
      .setDescription("Model to use")
      .setRequired(true)
      .setAutocomplete(true),
  );

function getModelsForChannel(channelId: string): { name: string; value: string }[] {
  const project = getProject(channelId);
  if (project?.auth_mode === "api_key") {
    return getApiKeyModels();
  }
  return getConfig().AVAILABLE_MODELS;
}

export async function autocomplete(
  interaction: AutocompleteInteraction,
): Promise<void> {
  const focused = interaction.options.getFocused();
  const models = getModelsForChannel(interaction.channelId);

  const choices = models
    .filter((m) => m.name.toLowerCase().includes(focused.toLowerCase()) || m.value.toLowerCase().includes(focused.toLowerCase()))
    .slice(0, 25);

  await interaction.respond(choices);
}

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const channelId = interaction.channelId;
  const model = interaction.options.getString("model", true);
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

  // Validate against the mode-specific model list
  const models = getModelsForChannel(channelId);
  if (models.length > 0 && !models.some((m) => m.value === model)) {
    await interaction.editReply({
      content: L(
        `Unknown model \`${model}\`. Available: ${models.map((m) => m.name).join(", ")}`,
        `알 수 없는 모델 \`${model}\`. 사용 가능: ${models.map((m) => m.name).join(", ")}`,
      ),
    });
    return;
  }

  setModel(channelId, model);

  const shortName = model.replace(/^claude-/, "").replace(/-\d{8}$/, "");

  await interaction.editReply({
    embeds: [
      {
        title: L(`Model: ${shortName}`, `모델: ${shortName}`),
        description: L(
          `This channel will now use \`${model}\`. The change takes effect on the next message.`,
          `이 채널은 이제 \`${model}\`을 사용합니다. 다음 메시지부터 적용됩니다.`,
        ),
        color: 0x7c3aed,
      },
    ],
  });
}
