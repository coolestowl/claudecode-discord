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
import { s_deleteWorkspaceOption, s_channelNotRegProject, s_deletingWorkspace, s_workspaceKept, s_projectUnregistered, s_unregisteredDesc } from "../../i18n/strings.js";

const execFile = promisify(execFileCb);

export const data = new SlashCommandBuilder()
  .setName("unregister")
  .setDescription("Unregister this channel from its project and delete the channel")
  .addBooleanOption((opt) =>
    opt
      .setName("delete-workspace")
      .setDescription(
        s_deleteWorkspaceOption(),
      )
      .setRequired(false),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const channelId = interaction.channelId;
  const project = getProject(channelId);
  const deleteWorkspace = interaction.options.getBoolean("delete-workspace") ?? false;

  if (!project) {
    await interaction.editReply({
      content: s_channelNotRegProject(),
    });
    return;
  }

  // Stop active session if any
  await sessionManager.stopSession(channelId);

  unregisterProject(channelId);

  const workspaceNote = deleteWorkspace && project.workspace_name
    ? s_deletingWorkspace()
    : project.workspace_name
      ? s_workspaceKept(project.workspace_name)
      : "";

  // Reply first — interaction webhooks work even after the channel is deleted
  await interaction.editReply({
    embeds: [
      {
        title: s_projectUnregistered(),
        description: s_unregisteredDesc(project.project_path, workspaceNote),
        color: 0xff0000,
      },
    ],
  });

  // Delete the channel
  const channel = interaction.channel;
  if (channel instanceof GuildChannel) {
    await channel.delete(`Unregistered project: ${project.project_path}`);
  }

  // Delete the Coder workspace only if explicitly requested
  if (deleteWorkspace && project.workspace_name) {
    execFile("coder", ["delete", project.workspace_name, "--yes"])
      .then(() => console.log(`[unregister] Deleted Coder workspace: ${project.workspace_name}`))
      .catch((e) => console.error(`[unregister] Failed to delete workspace ${project.workspace_name}: ${e.message}`));
  }
}
