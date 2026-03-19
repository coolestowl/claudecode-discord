import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";
import { getProject } from "../../db/database.js";
import { getConfig } from "../../utils/config.js";
import { L } from "../../utils/i18n.js";

const exec = promisify(execCb);

export const data = new SlashCommandBuilder()
  .setName("cmd")
  .setDescription(L("Run a shell command in the workspace", "워크스페이스에서 셸 명령어 실행"))
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
      content: L(
        "This channel is not registered. Use `/register` first.",
        "이 채널은 등록되지 않았습니다. 먼저 `/register`를 사용하세요.",
      ),
    });
    return;
  }

  const command = interaction.options.getString("command", true);
  const config = getConfig();

  let fullCommand: string;
  if (project.workspace_name) {
    const sshHost = `${project.workspace_name}${config.CODER_SSH_SUFFIX}`;
    const escaped = command.replace(/'/g, "'\\''");
    fullCommand = `ssh -o StrictHostKeyChecking=no -o BatchMode=yes ${sshHost} 'cd ${project.project_path} && ${escaped}'`;
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
  const truncated = output.length > 1900 ? output.slice(0, 1900) + "\n…(truncated)" : output;

  await interaction.editReply({
    content: [
      `\`$ ${command}\``,
      truncated ? `\`\`\`\n${truncated}\n\`\`\`` : L("*(no output)*", "*(출력 없음)*"),
      exitCode !== 0 ? `⚠️ exit ${exitCode}` : null,
    ].filter(Boolean).join("\n"),
  });
}
