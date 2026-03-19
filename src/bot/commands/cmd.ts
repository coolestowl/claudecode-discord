import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";
import { getProject } from "../../db/database.js";
import { getConfig } from "../../utils/config.js";
import { s_cmdDescription, s_channelNotReg, s_outputTooLong, s_noOutput } from "../../i18n/strings.js";

const exec = promisify(execCb);

export const data = new SlashCommandBuilder()
  .setName("cmd")
  .setDescription(s_cmdDescription())
  .addStringOption((opt) =>
    opt
      .setName("command")
      .setDescription("Shell command to execute")
      .setRequired(true),
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const channelId = interaction.channelId;
  const project = getProject(channelId);

  if (!project) {
    await interaction.editReply({
      content: s_channelNotReg(),
    });
    return;
  }

  const command = interaction.options.getString("command", true);
  const config = getConfig();

  let fullCommand: string;
  if (project.workspace_name) {
    const sshHost = `${project.workspace_name}${config.CODER_SSH_SUFFIX}`;
    const escaped = command.replace(/'/g, "'\\''");
    fullCommand = `ssh -tt -o StrictHostKeyChecking=no -o BatchMode=yes ${sshHost} 'cd ${project.project_path} && ${escaped}'`;
  } else {
    fullCommand = `cd ${project.project_path} && ${command}`;
  }

  let stdout = "";
  let stderr = "";
  let exitCode = 0;

  try {
    const result = await exec(fullCommand, { timeout: 30_000 });
    stdout = result.stdout;
    stderr = result.stderr;
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; code?: number };
    stdout = e.stdout ?? "";
    stderr = e.stderr ?? "";
    exitCode = e.code ?? 1;
  }

  const output = [stdout.trimEnd(), stderr.trimEnd()].filter(Boolean).join("\n");
  const header = [
    `\`$ ${command}\``,
    exitCode !== 0 ? `⚠️ exit ${exitCode}` : null,
  ].filter(Boolean).join("\n");

  if (output.length > 1900) {
    const preview = output.slice(0, 800);
    const lineCount = output.split("\n").length;
    const byteCount = Buffer.byteLength(output, "utf8");
    await interaction.editReply({
      content: [
        header,
        `\`\`\`\n${preview}\n\`\`\``,
        s_outputTooLong(lineCount, byteCount),
      ].join("\n"),
      files: [{ attachment: Buffer.from(output, "utf8"), name: "output.txt" }],
    });
  } else {
    await interaction.editReply({
      content: [
        header,
        output ? `\`\`\`\n${output}\n\`\`\`` : s_noOutput(),
      ].join("\n"),
    });
  }
}
