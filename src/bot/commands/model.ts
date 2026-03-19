import {
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { getProject, setModel } from "../../db/database.js";
import { getConfig } from "../../utils/config.js";
import { s_modelDescription, s_channelNotRegProject, s_modelSubscriptionOnly, s_unknownModel, s_modelSet, s_modelSetDesc } from "../../i18n/strings.js";

export const data = new SlashCommandBuilder()
  .setName("model")
  .setDescription(s_modelDescription())
  .addStringOption((opt) =>
    opt
      .setName("model")
      .setDescription("Model to use")
      .setRequired(true)
      .setAutocomplete(true),
  );

export async function autocomplete(
  interaction: AutocompleteInteraction,
): Promise<void> {
  const focused = interaction.options.getFocused();
  const models = getConfig().AVAILABLE_MODELS;

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
      content: s_channelNotRegProject(),
    });
    return;
  }

  if (project.auth_mode === "api_key") {
    await interaction.editReply({
      content: s_modelSubscriptionOnly(),
    });
    return;
  }

  // Validate against available models
  const models = getConfig().AVAILABLE_MODELS;
  if (models.length > 0 && !models.some((m) => m.value === model)) {
    await interaction.editReply({
      content: s_unknownModel(model, models.map((m) => m.name).join(", ")),
    });
    return;
  }

  setModel(channelId, model);

  const shortName = model.replace(/^claude-/, "").replace(/-\d{8}$/, "");

  await interaction.editReply({
    embeds: [
      {
        title: s_modelSet(shortName),
        description: s_modelSetDesc(model),
        color: 0x7c3aed,
      },
    ],
  });
}
