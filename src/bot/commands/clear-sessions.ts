import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { getProject, clearSessionId } from "../../db/database.js";
import { findSessionDir } from "./sessions.js";
import { getConfig } from "../../utils/config.js";
import { s_channelNotRegProject, s_noSessionDir, s_noSessionFiles, s_sessionsCleared, s_sessionsClearedDesc } from "../../i18n/strings.js";

/** Wrap a string in single quotes, escaping any embedded single quotes. */
function singleQuote(s: string): string {
  return "'" + s.replace(/'/g, "'\\''") + "'";
}

export const data = new SlashCommandBuilder()
  .setName("clear-sessions")
  .setDescription("Delete all Claude Code session files for this project")
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

  // Remote (Coder workspace) project: SSH to find and delete session files
  if (project.workspace_name) {
    const config = getConfig();
    const sshHost = `${project.workspace_name}${config.CODER_SSH_SUFFIX}`;
    // Use the same simple encoding that Claude Code uses for project dirs
    const encodedPath = project.project_path.replace(/[\\/\_]/g, "-");
    const remoteDir = `${config.CODER_REMOTE_HOME}/.claude/projects/${encodedPath}`;

    let deleted = 0;
    try {
      // Count .jsonl files first so we can give an accurate reply
      const countOut = execSync(
        `ssh -o StrictHostKeyChecking=no -o BatchMode=yes ${sshHost} /bin/sh -c ${singleQuote(
          `find ${singleQuote(remoteDir)} -name "*.jsonl" 2>/dev/null | wc -l`,
        )}`,
        { encoding: "utf-8", timeout: 15_000 },
      ).trim();

      deleted = parseInt(countOut, 10) || 0;

      if (deleted === 0) {
        await interaction.editReply({ content: s_noSessionFiles() });
        return;
      }

      // Delete the files on the remote machine
      execSync(
        `ssh -o StrictHostKeyChecking=no -o BatchMode=yes ${sshHost} /bin/sh -c ${singleQuote(
          `find ${singleQuote(remoteDir)} -name "*.jsonl" -delete`,
        )}`,
        { timeout: 15_000 },
      );
    } catch {
      await interaction.editReply({
        content: s_noSessionDir(project.project_path),
      });
      return;
    }

    // Clear the stored session ID so the next message starts fresh (no --resume)
    clearSessionId(channelId);

    await interaction.editReply({
      embeds: [
        {
          title: s_sessionsCleared(),
          description: [
            `Project: \`${project.project_path}\``,
            s_sessionsClearedDesc(deleted),
          ].join("\n"),
          color: 0xff6b6b,
        },
      ],
    });
    return;
  }

  // Local project: use filesystem directly
  const sessionDir = findSessionDir(project.project_path);
  if (!sessionDir) {
    await interaction.editReply({
      content: s_noSessionDir(project.project_path),
    });
    return;
  }

  const files = fs.readdirSync(sessionDir).filter((f) => f.endsWith(".jsonl"));
  if (files.length === 0) {
    await interaction.editReply({
      content: s_noSessionFiles(),
    });
    return;
  }

  let deleted = 0;
  for (const file of files) {
    try {
      fs.unlinkSync(path.join(sessionDir, file));
      deleted++;
    } catch {
      // skip files that can't be deleted
    }
  }

  // Clear the stored session ID so the next message starts fresh (no --resume)
  clearSessionId(channelId);

  await interaction.editReply({
    embeds: [
      {
        title: s_sessionsCleared(),
        description: [
          `Project: \`${project.project_path}\``,
          s_sessionsClearedDesc(deleted),
        ].join("\n"),
        color: 0xff6b6b,
      },
    ],
  });
}
