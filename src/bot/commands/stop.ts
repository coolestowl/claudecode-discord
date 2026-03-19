import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { getProject } from "../../db/database.js";
import { sessionManager } from "../../claude/session-manager.js";
import { s_channelNotRegProject, s_sessionStopped, s_sessionStoppedDesc, s_noActiveSession } from "../../i18n/strings.js";

export const data = new SlashCommandBuilder()
  .setName("stop")
  .setDescription("Stop the active Claude Code session in this channel");

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

  const stopped = await sessionManager.stopSession(channelId);
  if (stopped) {
    await interaction.editReply({
      embeds: [
        {
          title: s_sessionStopped(),
          description: s_sessionStoppedDesc(project.project_path),
          color: 0xff6600,
        },
      ],
    });
  } else {
    await interaction.editReply({
      content: s_noActiveSession(),
    });
  }
}
