import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";
import { getProject } from "../../db/database.js";
import { getConfig } from "../../utils/config.js";
import {
  s_channelNotReg,
  s_syncingCredentials,
  s_syncFailed,
  s_syncConfigDescription,
  s_syncConfigNoConfigWorkspace,
  s_syncConfigSuccess,
} from "../../i18n/strings.js";

const exec = promisify(execCb);

export const data = new SlashCommandBuilder()
  .setName("sync-config")
  .setDescription(s_syncConfigDescription())
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const config = getConfig();
  const channelId = interaction.channelId;

  const project = getProject(channelId);
  if (!project) {
    await interaction.editReply({ content: s_channelNotReg() });
    return;
  }

  if (!config.CODER_CONFIG_WORKSPACE) {
    await interaction.editReply({ content: s_syncConfigNoConfigWorkspace() });
    return;
  }

  const configHost = `${config.CODER_CONFIG_WORKSPACE}${config.CODER_SSH_SUFFIX}`;

  await interaction.editReply({
    content: s_syncingCredentials(config.CODER_CONFIG_WORKSPACE),
  });

  try {
    let syncCmd: string;

    if (project.workspace_name) {
      // Remote workspace: relay the tarball over SSH through this bot host
      const sshHost = `${project.workspace_name}${config.CODER_SSH_SUFFIX}`;
      syncCmd = `ssh ${configHost} "tar -czf - -C /home/coder .claude.json .claude 2>/dev/null" | ssh ${sshHost} "cd /home/coder && rm -f .claude.json && rm -rf .claude && tar -xzf -"`;
    } else {
      // Local workspace: extract directly on this machine
      const localHome = config.CODER_REMOTE_HOME;
      syncCmd = `ssh ${configHost} "tar -czf - -C /home/coder .claude.json .claude 2>/dev/null" | (cd ${localHome} && rm -f .claude.json && rm -rf .claude && tar -xzf -)`;
    }

    await exec(syncCmd, { timeout: 60_000 });

    const target = project.workspace_name ?? "local";
    console.log(`[sync-config] Claude config synced: ${configHost} → ${target}`);

    await interaction.editReply({
      content: s_syncConfigSuccess(config.CODER_CONFIG_WORKSPACE, target),
    });
  } catch (err) {
    console.error(`[sync-config] Sync failed: ${(err as Error).message}`);
    await interaction.editReply({
      content: s_syncFailed((err as Error).message),
    });
  }
}
