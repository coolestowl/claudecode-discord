import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} from "discord.js";
import wcwidth from "wcwidth";
import {
  s_truncated,
  s_stop,
  s_completed,
  s_autoApprove,
  s_toolUse,
  s_file,
  s_changes,
  s_contentPreview,
  s_command,
  s_description,
  s_input,
  s_approve,
  s_deny,
  s_autoApproveAll,
  s_selectOptions,
  s_customInput,
  s_costEst,
  s_duration,
  s_taskCompleteEmoji,
  s_taskCompleteTitle,
} from "../i18n/strings.js";

const MAX_DISCORD_LENGTH = 1900; // leave room for formatting

/**
 * Convert markdown tables to Unicode box-drawing tables wrapped in code blocks,
 * since Discord does not render markdown table syntax natively.
 *
 * Example input:
 *   | Name | Status |
 *   |------|--------|
 *   | foo  | 🟢     |
 *
 * Example output:
 *   ```
 *   ┌──────┬────────┐
 *   │ Name │ Status │
 *   ├──────┼────────┤
 *   │ foo  │ 🟢     │
 *   └──────┴────────┘
 *   ```
 */
export function convertMarkdownTables(text: string): string {
  // Match a full markdown table: header row + separator row + one or more data rows.
  // Each row starts with | and ends with | (possibly with trailing whitespace).
  const tableRegex = /(?:^\|.+\|\s*\n)(?:^\|[\s|:=-]+\|\s*\n)(?:^\|.+\|\s*\n)*/gm;

  return text.replace(tableRegex, (tableStr) => {
    const lines = tableStr.trimEnd().split("\n");

    // Parse pipe-separated cells, trimming surrounding whitespace.
    const parseCells = (line: string): string[] =>
      line.split("|").slice(1, -1).map((cell) => cell.trim());

    const allRows = lines.map(parseCells);
    const colCount = Math.max(...allRows.map((r) => r.length));

    // Pad every row to the same column count.
    const normalizedRows = allRows.map((row) => {
      const padded = [...row];
      while (padded.length < colCount) padded.push("");
      return padded;
    });

    const headerRow = normalizedRows[0];
    // normalizedRows[1] is the separator row — skip it.
    const dataRows = normalizedRows.slice(2);

    // Calculate the display width for each column using wcwidth, which correctly
    // accounts for double-width characters (CJK, emoji, etc.).
    const displayWidth = (s: string): number => Math.max(0, wcwidth(s));

    const colWidths: number[] = Array.from({ length: colCount }, (_, c) => {
      const cellWidths = [headerRow[c], ...dataRows.map((r) => r[c])].map(
        (s) => displayWidth(s ?? ""),
      );
      return Math.max(1, ...cellWidths);
    });

    // Pad to visual width: account for double-width chars taking up extra space.
    const pad = (s: string, w: number) =>
      s + " ".repeat(Math.max(0, w - displayWidth(s)));

    const top = "┌" + colWidths.map((w) => "─".repeat(w + 2)).join("┬") + "┐";
    const mid = "├" + colWidths.map((w) => "─".repeat(w + 2)).join("┼") + "┤";
    const bot = "└" + colWidths.map((w) => "─".repeat(w + 2)).join("┴") + "┘";

    const fmtRow = (cells: string[]) =>
      "│" + cells.map((c, i) => ` ${pad(c, colWidths[i])} `).join("│") + "│";

    const tableLines = [
      top,
      fmtRow(headerRow),
      mid,
      ...dataRows.map(fmtRow),
      bot,
    ];

    return "```\n" + tableLines.join("\n") + "\n```\n";
  });
}

export function formatStreamChunk(text: string): string {
  const converted = convertMarkdownTables(text);
  if (converted.length <= MAX_DISCORD_LENGTH) return converted;
  return converted.slice(0, MAX_DISCORD_LENGTH) + "\n" + s_truncated();
}

export function splitMessage(text: string): string[] {
  const chunks: string[] = [];
  let remaining = convertMarkdownTables(text);

  while (remaining.length > 0) {
    if (remaining.length <= MAX_DISCORD_LENGTH) {
      chunks.push(remaining);
      break;
    }

    // Try to split at a newline
    let splitAt = remaining.lastIndexOf("\n", MAX_DISCORD_LENGTH);
    if (splitAt === -1 || splitAt < MAX_DISCORD_LENGTH / 2) {
      splitAt = MAX_DISCORD_LENGTH;
    }

    let chunk = remaining.slice(0, splitAt);
    remaining = remaining.slice(splitAt);

    // Check if we're splitting inside an unclosed code block
    const fenceRegex = /^```/gm;
    let insideBlock = false;
    let blockLang = "";
    let match;
    while ((match = fenceRegex.exec(chunk)) !== null) {
      if (insideBlock) {
        insideBlock = false;
        blockLang = "";
      } else {
        insideBlock = true;
        const lineEnd = chunk.indexOf("\n", match.index);
        blockLang = chunk.slice(match.index + 3, lineEnd === -1 ? undefined : lineEnd).trim();
      }
    }

    if (insideBlock) {
      // Close the code block in this chunk, reopen in the next
      chunk += "\n```";
      remaining = "```" + blockLang + "\n" + remaining;
    }

    chunks.push(chunk);
  }

  return chunks;
}

export function createStopButton(
  channelId: string,
): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`stop:${channelId}`)
      .setLabel(s_stop())
      .setStyle(ButtonStyle.Danger)
      .setEmoji("⏹️"),
  );
}

export function createCompletedButton(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("completed")
      .setLabel(s_completed())
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("✅")
      .setDisabled(true),
  );
}

export function createToolApprovalEmbed(
  toolName: string,
  input: Record<string, unknown>,
  requestId: string,
  autoApproved = false,
): { embed: EmbedBuilder; row: ActionRowBuilder<ButtonBuilder> } {
  const embed = new EmbedBuilder()
    .setTitle(
      autoApproved
        ? s_autoApprove(toolName)
        : s_toolUse(toolName),
    )
    .setColor(autoApproved ? 0x00cc66 : 0xffa500)
    .setTimestamp();

  // Add relevant fields based on tool type
  if (toolName === "Edit" || toolName === "Write") {
    const filePath = (input.file_path as string) ?? "unknown";
    embed.addFields({ name: s_file(), value: `\`${filePath}\``, inline: false });

    if (input.old_string && input.new_string) {
      const diff = `\`\`\`diff\n- ${String(input.old_string).slice(0, 500)}\n+ ${String(input.new_string).slice(0, 500)}\n\`\`\``;
      embed.addFields({ name: s_changes(), value: diff, inline: false });
    } else if (input.content) {
      const preview = String(input.content).slice(0, 500);
      embed.addFields({
        name: s_contentPreview(),
        value: `\`\`\`\n${preview}\n\`\`\``,
        inline: false,
      });
    }
  } else if (toolName === "Bash") {
    const command = (input.command as string) ?? "unknown";
    const description = (input.description as string) ?? "";
    embed.addFields(
      { name: s_command(), value: `\`\`\`bash\n${command}\n\`\`\``, inline: false },
    );
    if (description) {
      embed.addFields({ name: s_description(), value: description, inline: false });
    }
  } else {
    // Generic tool display - skip empty input
    const summary = JSON.stringify(input, null, 2);
    if (summary && summary !== "{}") {
      embed.addFields({
        name: s_input(),
        value: `\`\`\`json\n${summary.slice(0, 800)}\n\`\`\``,
        inline: false,
      });
    }
  }

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`approve:${requestId}`)
      .setLabel(s_approve())
      .setStyle(ButtonStyle.Success)
      .setEmoji("✅"),
    new ButtonBuilder()
      .setCustomId(`deny:${requestId}`)
      .setLabel(s_deny())
      .setStyle(ButtonStyle.Danger)
      .setEmoji("❌"),
    new ButtonBuilder()
      .setCustomId(`approve-all:${requestId}`)
      .setLabel(s_autoApproveAll())
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("⚡"),
  );

  return { embed, row };
}

export interface AskQuestionData {
  question: string;
  header: string;
  options: { label: string; description: string }[];
  multiSelect: boolean;
}

export function createAskUserQuestionEmbed(
  questionData: AskQuestionData,
  requestId: string,
  questionIndex: number,
  totalQuestions: number,
): { embed: EmbedBuilder; components: ActionRowBuilder<any>[] } {
  const title =
    totalQuestions > 1
      ? `❓ ${questionData.header} (${questionIndex + 1}/${totalQuestions})`
      : `❓ ${questionData.header}`;

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(questionData.question)
    .setColor(0x7c3aed)
    .setTimestamp();

  // Add option descriptions as embed fields
  for (const opt of questionData.options) {
    embed.addFields({
      name: opt.label,
      value: opt.description || "\u200b",
      inline: false,
    });
  }

  const components: ActionRowBuilder<any>[] = [];

  if (questionData.multiSelect) {
    // Use StringSelectMenu for multi-select
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`ask-select:${requestId}`)
      .setPlaceholder(s_selectOptions())
      .setMinValues(1)
      .setMaxValues(questionData.options.length)
      .addOptions(
        questionData.options.map((opt, i) => ({
          label: opt.label.slice(0, 100),
          value: String(i),
          ...(opt.description
            ? { description: opt.description.slice(0, 100) }
            : {}),
        })),
      );

    components.push(
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu),
    );

    // Custom input button in separate row
    components.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`ask-other:${requestId}`)
          .setLabel(s_customInput())
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("✏️"),
      ),
    );
  } else {
    // Use buttons for single select
    const buttons: ButtonBuilder[] = questionData.options.map((opt, i) =>
      new ButtonBuilder()
        .setCustomId(`ask-opt:${requestId}:${i}`)
        .setLabel(opt.label.slice(0, 80))
        .setStyle(i === 0 ? ButtonStyle.Primary : ButtonStyle.Secondary),
    );

    // Custom input button
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`ask-other:${requestId}`)
        .setLabel(s_customInput())
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("✏️"),
    );

    // Discord max 5 buttons per row
    for (let i = 0; i < buttons.length; i += 5) {
      components.push(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          ...buttons.slice(i, i + 5),
        ),
      );
    }
  }

  return { embed, components };
}

export function createResultEmbed(
  result: string,
  costUsd: number,
  durationMs: number,
  showCost: boolean = true,
): EmbedBuilder {
  const duration = `${(durationMs / 1000).toFixed(1)}s`;
  const footer = showCost
    ? `${s_costEst()} : $${costUsd.toFixed(4)}  |  ${s_duration()} : ${duration}`
    : `${s_duration()} : ${duration}`;

  const embed = new EmbedBuilder()
    .setTitle(s_taskCompleteEmoji())
    .setDescription(result.slice(0, 4000))
    .setColor(0x00ff00)
    .setFooter({ text: footer })
    .setTimestamp();

  return embed;
}

/**
 * Format task completion as plain text messages (for proper Markdown rendering in Discord).
 * Returns an array of message strings that respect Discord's character limit.
 */
export function formatResultAsPlainText(
  result: string,
  costUsd: number,
  durationMs: number,
  showCost: boolean = true,
): string[] {
  const duration = `${(durationMs / 1000).toFixed(1)}s`;
  const metaLine = showCost
    ? `-# ✅ ${s_taskCompleteTitle()}  ·  ${s_costEst()}: $${costUsd.toFixed(4)}  ·  ${s_duration()}: ${duration}`
    : `-# ✅ ${s_taskCompleteTitle()}  ·  ${s_duration()}: ${duration}`;

  // Reserve space for the meta line + separator
  const metaBlock = `${metaLine}`;
  const metaBlockLen = metaBlock.length + 2; // +2 for \n\n separator

  // First chunk gets the result text; subsequent chunks are overflow
  const maxFirstChunk = MAX_DISCORD_LENGTH - metaBlockLen;
  const trimmedResult = result.slice(0, 4000);

  if (trimmedResult.length <= maxFirstChunk) {
    return [`${trimmedResult}\n\n${metaBlock}`];
  }

  // Need to split: use splitMessage for smart code-fence-aware splitting
  const chunks = splitMessage(trimmedResult);
  // Append meta info to the last chunk
  const lastIdx = chunks.length - 1;
  if (chunks[lastIdx].length + metaBlockLen <= MAX_DISCORD_LENGTH) {
    chunks[lastIdx] = `${chunks[lastIdx]}\n\n${metaBlock}`;
  } else {
    chunks.push(metaBlock);
  }
  return chunks;
}
