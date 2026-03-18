import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  GuildChannel,
} from "discord.js";
import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";
import { unregisterProject, getProject } from "../../db/database.js";
import { sessionManager } from "../../claude/session-manager.js";
import { L } from "../../utils/i18n.js";

const execFile = promisify(execFileCb);

export const data = new SlashCommandBuilder()
  .setName("unregister")
  .setDescription("Unregister this channel from its project and delete the channel")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const channelId = interaction.channelId;
  const project = getProject(channelId);

  if (!project) {
    await interaction.editReply({
      content: L("This channel is not registered to any project.", "이 채널은 어떤 프로젝트에도 등록되어 있지 않습니다."),
    });
    return;
  }

  // Stop active session if any
  await sessionManager.stopSession(channelId);

  unregisterProject(channelId);

  // Reply first — interaction webhooks work even after the channel is deleted
  await interaction.editReply({
    embeds: [
      {
        title: L("Project Unregistered", "프로젝트 등록 해제됨"),
        description: L(
          `Removed link to \`${project.project_path}\`. Deleting channel...`,
          `\`${project.project_path}\` 연결이 해제되었습니다. 채널을 삭제합니다...`,
        ),
        color: 0xff0000,
      },
    ],
  });

  // Delete the channel
  const channel = interaction.channel;
  if (channel instanceof GuildChannel) {
    await channel.delete(`Unregistered project: ${project.project_path}`);
  }

  // Delete the Coder workspace if one is associated (fire-and-forget, don't block reply)
  if (project.workspace_name) {
    execFile("coder", ["delete", project.workspace_name, "--yes"])
      .then(() => console.log(`[unregister] Deleted Coder workspace: ${project.workspace_name}`))
      .catch((e) => console.error(`[unregister] Failed to delete workspace ${project.workspace_name}: ${e.message}`));
  }
}
