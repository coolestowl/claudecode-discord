import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { getProject } from "../../db/database.js";
import { sessionManager } from "../../claude/session-manager.js";
import {
  s_channelNotRegProject,
  s_noMessagesInQueue,
  s_clearAll,
  s_messageQueue,
  s_queueCleared,
  s_queueClearedDesc,
} from "../../i18n/strings.js";

export const data = new SlashCommandBuilder()
  .setName("queue")
  .setDescription("View and manage queued messages in this channel")
  .addSubcommand((sub) =>
    sub.setName("list").setDescription("Show all queued messages")
  )
  .addSubcommand((sub) =>
    sub.setName("clear").setDescription("Clear all queued messages")
  );

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

  const subcommand = interaction.options.getSubcommand();

  if (subcommand === "list") {
    const queue = sessionManager.getQueue(channelId);
    if (queue.length === 0) {
      await interaction.editReply({
        content: s_noMessagesInQueue(),
      });
      return;
    }

    const list = queue
      .map((item, idx) => {
        const preview =
          item.prompt.length > 100
            ? item.prompt.slice(0, 100) + "…"
            : item.prompt;
        return `**${idx + 1}.** ${preview}`;
      })
      .join("\n\n");

    // Each message gets a ❌ button, plus a Clear All button
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    const itemButtons: ButtonBuilder[] = queue.map((_, idx) =>
      new ButtonBuilder()
        .setCustomId(`queue-remove:${channelId}:${idx}`)
        .setLabel(`❌ ${idx + 1}`)
        .setStyle(ButtonStyle.Secondary)
    );

    const clearButton = new ButtonBuilder()
      .setCustomId(`queue-clear:${channelId}`)
      .setLabel(s_clearAll())
      .setStyle(ButtonStyle.Danger);

    // Discord allows max 5 buttons per row, max 5 rows
    // Fit item buttons (up to 4 per row to leave room) + clear button
    const allButtons = [...itemButtons.slice(0, 19), clearButton]; // max 20 buttons (4 rows * 5)
    for (let i = 0; i < allButtons.length; i += 5) {
      const chunk = allButtons.slice(i, i + 5);
      rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(...chunk));
    }

    await interaction.editReply({
      embeds: [
        {
          title: s_messageQueue(queue.length),
          description: list,
          color: 0x5865f2,
        },
      ],
      components: rows,
    });
  } else if (subcommand === "clear") {
    const cleared = sessionManager.clearQueue(channelId);
    await interaction.editReply({
      embeds: [
        {
          title: s_queueCleared(),
          description: s_queueClearedDesc(cleared),
          color: 0xff6600,
        },
      ],
    });
  }
}
