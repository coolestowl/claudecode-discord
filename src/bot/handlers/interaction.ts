import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { isAllowedUser } from "../../security/guard.js";
import { sessionManager } from "../../claude/session-manager.js";
import { upsertSession, getProject, getSession } from "../../db/database.js";
import { findSessionDir, getLastAssistantMessage } from "../commands/sessions.js";
import { s_notAuthorizedShort, s_invalidButton, s_taskStopped, s_noActiveSessionShort, s_queueExpired, s_messageAddedToQueue, s_cancelled, s_sessionResumed, s_sessionResumedDesc, s_questionExpired, s_selected, s_typeAnswer, s_queueCleared, s_queueClearedDesc, s_itemNotInQueue, s_messageRemoved, s_messageRemovedDesc, s_removed, s_projectNotFound, s_sessionDeleted, s_sessionDeletedDesc, s_failedDeleteSession, s_approvalExpired, s_approved, s_denied, s_autoApproveEnabled, s_newSessionTitle, s_newSessionReady, s_resume, s_delete, s_cancel, s_lastConversation, s_sessionSelected, s_sessionSelectedDesc, s_clearAll, s_messageQueue } from "../../i18n/strings.js";

export async function handleButtonInteraction(
  interaction: ButtonInteraction,
): Promise<void> {
  if (!isAllowedUser(interaction.user.id)) {
    await interaction.reply({
      content: s_notAuthorizedShort(),
      ephemeral: true,
    });
    return;
  }

  const customId = interaction.customId;
  // Use split with limit to handle session IDs that might contain colons
  const colonIndex = customId.indexOf(":");
  const action = colonIndex === -1 ? customId : customId.slice(0, colonIndex);
  const requestId = colonIndex === -1 ? "" : customId.slice(colonIndex + 1);

  if (!requestId) {
    await interaction.reply({
      content: s_invalidButton(),
      ephemeral: true,
    });
    return;
  }

  // Handle stop button
  if (action === "stop") {
    const channelId = requestId;
    const stopped = await sessionManager.stopSession(channelId);
    await interaction.update({
      content: s_taskStopped(),
      components: [],
    });
    if (!stopped) {
      await interaction.followUp({
        content: s_noActiveSessionShort(),
        ephemeral: true,
      });
    }
    return;
  }

  // Handle queue confirmation
  if (action === "queue-yes") {
    const channelId = requestId;
    const confirmed = sessionManager.confirmQueue(channelId);
    if (!confirmed) {
      await interaction.update({
        content: s_queueExpired(),
        components: [],
      });
      return;
    }
    const queueSize = sessionManager.getQueueSize(channelId);
    await interaction.update({
      content: s_messageAddedToQueue(queueSize),
      components: [],
    });
    return;
  }

  // Handle queue cancellation
  if (action === "queue-no") {
    const channelId = requestId;
    sessionManager.cancelQueue(channelId);
    await interaction.update({
      content: s_cancelled(),
      components: [],
    });
    return;
  }

  // Handle session resume button
  if (action === "session-resume") {
    const sessionId = requestId;
    const channelId = interaction.channelId;
    const { randomUUID } = await import("node:crypto");
    upsertSession(randomUUID(), channelId, sessionId, "idle");

    await interaction.update({
      embeds: [
        {
          title: s_sessionResumed(),
          description: s_sessionResumedDesc(sessionId),
          color: 0x00ff00,
        },
      ],
      components: [],
    });
    return;
  }

  // Handle session cancel button
  if (action === "session-cancel") {
    await interaction.update({
      content: s_cancelled(),
      embeds: [],
      components: [],
    });
    return;
  }

  // Handle AskUserQuestion option selection
  if (action === "ask-opt") {
    // requestId format: "uuid:optionIndex"
    const lastColon = requestId.lastIndexOf(":");
    const actualRequestId = requestId.slice(0, lastColon);
    const selectedLabel = ("label" in interaction.component ? interaction.component.label : null) ?? "Unknown";

    const resolved = sessionManager.resolveQuestion(actualRequestId, selectedLabel);
    if (!resolved) {
      await interaction.reply({ content: s_questionExpired(), ephemeral: true });
      return;
    }

    await interaction.update({
      content: s_selected(selectedLabel),
      embeds: [],
      components: [],
    });
    return;
  }

  // Handle AskUserQuestion custom text input
  if (action === "ask-other") {
    sessionManager.enableCustomInput(requestId, interaction.channelId);

    await interaction.update({
      content: s_typeAnswer(),
      embeds: [],
      components: [],
    });
    return;
  }

  // Handle queue clear button
  if (action === "queue-clear") {
    const channelId = requestId;
    const cleared = sessionManager.clearQueue(channelId);
    await interaction.update({
      embeds: [
        {
          title: s_queueCleared(),
          description: s_queueClearedDesc(cleared),
          color: 0xff6600,
        },
      ],
      components: [],
    });
    return;
  }

  // Handle queue remove individual item button
  if (action === "queue-remove") {
    // requestId format: "channelId:index"
    const lastColon = requestId.lastIndexOf(":");
    const channelId = requestId.slice(0, lastColon);
    const index = parseInt(requestId.slice(lastColon + 1), 10);
    const removed = sessionManager.removeFromQueue(channelId, index);

    if (!removed) {
      await interaction.update({
        content: s_itemNotInQueue(),
        embeds: [],
        components: [],
      });
      return;
    }

    const preview = removed.length > 60 ? removed.slice(0, 60) + "…" : removed;

    // Show updated queue
    const queue = sessionManager.getQueue(channelId);
    if (queue.length === 0) {
      await interaction.update({
        embeds: [
          {
            title: s_messageRemoved(),
            description: s_messageRemovedDesc(preview),
            color: 0xff6600,
          },
        ],
        components: [],
      });
      return;
    }

    // Rebuild list and buttons with updated queue
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = await import("discord.js");
    const list = queue
      .map((item: { prompt: string }, idx: number) => {
        const p = item.prompt.length > 100 ? item.prompt.slice(0, 100) + "…" : item.prompt;
        return `**${idx + 1}.** ${p}`;
      })
      .join("\n\n");

    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    const itemButtons = queue.map((_: unknown, idx: number) =>
      new ButtonBuilder()
        .setCustomId(`queue-remove:${channelId}:${idx}`)
        .setLabel(`❌ ${idx + 1}`)
        .setStyle(ButtonStyle.Secondary)
    );
    const clearButton = new ButtonBuilder()
      .setCustomId(`queue-clear:${channelId}`)
      .setLabel(s_clearAll())
      .setStyle(ButtonStyle.Danger);

    const allButtons = [...itemButtons.slice(0, 19), clearButton];
    for (let i = 0; i < allButtons.length; i += 5) {
      const chunk = allButtons.slice(i, i + 5);
      rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(...chunk));
    }

    await interaction.update({
      embeds: [
        {
          title: s_messageQueue(queue.length),
          description: `~~${preview}~~ ${s_removed()}\n\n${list}`,
          color: 0x5865f2,
        },
      ],
      components: rows,
    });
    return;
  }

  // Handle session delete button
  if (action === "session-delete") {
    const sessionId = requestId;
    const channelId = interaction.channelId;
    const project = getProject(channelId);

    if (!project) {
      await interaction.update({
        content: s_projectNotFound(),
        embeds: [],
        components: [],
      });
      return;
    }

    const sessionDir = findSessionDir(project.project_path);
    if (sessionDir) {
      const filePath = path.join(sessionDir, `${sessionId}.jsonl`);
      try {
        fs.unlinkSync(filePath);

        // If deleting the currently active session, reset DB so next message creates fresh session
        const dbSession = getSession(channelId);
        if (dbSession?.session_id === sessionId) {
          const { randomUUID } = await import("node:crypto");
          upsertSession(randomUUID(), channelId, null, "idle");
        }

        await interaction.update({
          embeds: [
            {
              title: s_sessionDeleted(),
              description: s_sessionDeletedDesc(sessionId),
              color: 0xff6b6b,
            },
          ],
          components: [],
        });
      } catch {
        await interaction.update({
          content: s_failedDeleteSession(),
          embeds: [],
          components: [],
        });
      }
    }
    return;
  }

  let decision: "approve" | "deny" | "approve-all";
  if (action === "approve") {
    decision = "approve";
  } else if (action === "deny") {
    decision = "deny";
  } else if (action === "approve-all") {
    decision = "approve-all";
  } else {
    return;
  }

  const resolved = sessionManager.resolveApproval(requestId, decision);
  if (!resolved) {
    await interaction.reply({
      content: s_approvalExpired(),
      ephemeral: true,
    });
    return;
  }

  const labels: Record<string, string> = {
    approve: s_approved(),
    deny: s_denied(),
    "approve-all": s_autoApproveEnabled(),
  };

  await interaction.update({
    content: labels[decision],
    components: [], // remove buttons
  });
}

export async function handleSelectMenuInteraction(
  interaction: StringSelectMenuInteraction,
): Promise<void> {
  if (!isAllowedUser(interaction.user.id)) {
    await interaction.reply({
      content: s_notAuthorizedShort(),
      ephemeral: true,
    });
    return;
  }

  // Handle AskUserQuestion multi-select
  if (interaction.customId.startsWith("ask-select:")) {
    const askRequestId = interaction.customId.slice("ask-select:".length);
    const options = (interaction.component as any).options ?? [];
    const selectedLabels = interaction.values.map((val: string) => {
      const opt = options.find((o: any) => o.value === val);
      return opt?.label ?? val;
    });
    const answer = selectedLabels.join(", ");

    const resolved = sessionManager.resolveQuestion(askRequestId, answer);
    if (!resolved) {
      await interaction.reply({ content: s_questionExpired(), ephemeral: true });
      return;
    }

    await interaction.update({
      content: s_selected(answer),
      embeds: [],
      components: [],
    });
    return;
  }

  if (interaction.customId === "session-select") {
    const selectedSessionId = interaction.values[0];

    // Handle "New Session" option
    if (selectedSessionId === "__new_session__") {
      const channelId = interaction.channelId;
      const { randomUUID } = await import("node:crypto");
      // Set session_id to null so next message creates a fresh session
      upsertSession(randomUUID(), channelId, null, "idle");

      await interaction.update({
        embeds: [
          {
            title: s_newSessionTitle(),
            description: s_newSessionReady(),
            color: 0x00ff00,
          },
        ],
        components: [],
      });
      return;
    }

    // Defer first to avoid 3s timeout while reading JSONL
    await interaction.deferUpdate();

    // Read last assistant message from session file
    const channelId = interaction.channelId;
    const project = getProject(channelId);
    let lastMessage = "";
    if (project) {
      const sessionDir = findSessionDir(project.project_path);
      if (sessionDir) {
        const filePath = path.join(sessionDir, `${selectedSessionId}.jsonl`);
        try {
          lastMessage = await getLastAssistantMessage(filePath);
        } catch {
          // ignore
        }
      }
    }

    // Show Resume / Delete buttons
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`session-resume:${selectedSessionId}`)
        .setLabel(s_resume())
        .setStyle(ButtonStyle.Success)
        .setEmoji("▶️"),
      new ButtonBuilder()
        .setCustomId(`session-delete:${selectedSessionId}`)
        .setLabel(s_delete())
        .setStyle(ButtonStyle.Danger)
        .setEmoji("🗑️"),
      new ButtonBuilder()
        .setCustomId(`session-cancel:_`)
        .setLabel(s_cancel())
        .setStyle(ButtonStyle.Secondary),
    );

    const preview = lastMessage && lastMessage !== "(no message)"
      ? `\n\n${s_lastConversation()}\n${lastMessage.slice(0, 300)}${lastMessage.length > 300 ? "..." : ""}`
      : "";

    await interaction.editReply({
      embeds: [
        {
          title: s_sessionSelected(),
          description: s_sessionSelectedDesc(selectedSessionId) + preview,
          color: 0x7c3aed,
        },
      ],
      components: [row],
    });
  }
}
