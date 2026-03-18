import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { getProject } from "../../db/database.js";
import { getConfig } from "../../utils/config.js";
import { L } from "../../utils/i18n.js";

const execFile = promisify(execFileCb);

const CREDENTIALS_RELATIVE = ".claude/.credentials.json";
const USAGE_API_URL = "https://api.anthropic.com/api/oauth/usage";

interface Credentials {
  claudeAiOauth?: {
    accessToken?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface UsageResponse {
  [key: string]: unknown;
}

/** Read credentials from local filesystem. */
async function readLocalCredentials(): Promise<Credentials> {
  const credPath = join(homedir(), CREDENTIALS_RELATIVE);
  const raw = await readFile(credPath, "utf-8");
  return JSON.parse(raw) as Credentials;
}

/** Read credentials from a remote Coder workspace via SSH. */
async function readRemoteCredentials(sshHost: string): Promise<Credentials> {
  const { stdout } = await execFile(
    "ssh",
    [
      "-o", "StrictHostKeyChecking=no",
      "-o", "BatchMode=yes",
      sshHost,
      "cat",
      `~/${CREDENTIALS_RELATIVE}`,
    ],
    { timeout: 15_000 },
  );
  return JSON.parse(stdout) as Credentials;
}

/** Extract accessToken from credentials object. */
function extractToken(creds: Credentials): string | null {
  return creds?.claudeAiOauth?.accessToken ?? null;
}

/** Fetch usage from the Anthropic OAuth usage API. */
async function fetchUsage(accessToken: string): Promise<UsageResponse> {
  const res = await fetch(USAGE_API_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "anthropic-beta": "oauth-2025-04-20",
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
  return res.json() as Promise<UsageResponse>;
}

/** Recursively flatten a nested object into "key.sub: value" lines, up to maxDepth. */
function flattenUsage(obj: unknown, prefix = "", depth = 0, maxDepth = 4): string[] {
  if (depth > maxDepth) return [];
  if (obj === null || obj === undefined) return [`${prefix}: —`];
  if (typeof obj !== "object" || Array.isArray(obj)) {
    const val = Array.isArray(obj) ? JSON.stringify(obj) : String(obj);
    return [`${prefix}: ${val}`];
  }
  const lines: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      lines.push(...flattenUsage(v, key, depth + 1, maxDepth));
    } else {
      lines.push(...flattenUsage(v, key, depth + 1, maxDepth));
    }
  }
  return lines;
}

/** Format usage response object into Discord embed fields. */
function buildUsageEmbed(usage: UsageResponse): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(L("Claude Subscription Usage", "Claude 구독 사용량"))
    .setColor(0x7c3aed)
    .setTimestamp();

  // Try to show top-level keys as individual fields; fall back to raw dump
  const entries = Object.entries(usage);
  if (entries.length === 0) {
    embed.setDescription(L("No usage data returned.", "사용량 데이터가 없습니다."));
    return embed;
  }

  for (const [key, value] of entries) {
    let display: string;
    if (typeof value === "object" && value !== null) {
      display = flattenUsage(value, "", 0, 3)
        .map((line) => `\`${line}\``)
        .join("\n");
    } else {
      display = `\`${String(value)}\``;
    }
    // Discord field value max 1024 chars
    embed.addFields({
      name: key,
      value: display.slice(0, 1024) || "—",
      inline: false,
    });
  }

  return embed;
}

export const data = new SlashCommandBuilder()
  .setName("usage")
  .setDescription(
    L(
      "Show Claude subscription usage (subscription mode only)",
      "Claude 구독 사용량 확인 (구독 모드 전용)",
    ),
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

  if ((project.auth_mode ?? "subscription") !== "subscription") {
    await interaction.editReply({
      content: L(
        "⚠️ The `/usage` command is only available in **subscription** mode. This channel uses API key mode.",
        "⚠️ `/usage` 명령은 **구독** 모드에서만 사용할 수 있습니다. 이 채널은 API 키 모드입니다.",
      ),
    });
    return;
  }

  try {
    const config = getConfig();

    // Read credentials: remote if workspace_name is set, local otherwise
    let creds: Credentials;
    if (project.workspace_name) {
      const sshHost = `${project.workspace_name}${config.CODER_SSH_SUFFIX}`;
      creds = await readRemoteCredentials(sshHost);
    } else {
      creds = await readLocalCredentials();
    }

    const token = extractToken(creds);
    if (!token) {
      await interaction.editReply({
        content: L(
          "❌ Could not find `accessToken` in `~/.claude/.credentials.json`. Make sure you are logged in with `claude login`.",
          "❌ `~/.claude/.credentials.json`에서 `accessToken`을 찾을 수 없습니다. `claude login`으로 로그인되어 있는지 확인하세요.",
        ),
      });
      return;
    }

    const usage = await fetchUsage(token);
    const embed = buildUsageEmbed(usage);

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await interaction.editReply({
      content: L(`❌ Failed to fetch usage: ${msg}`, `❌ 사용량 조회 실패: ${msg}`),
    });
  }
}
