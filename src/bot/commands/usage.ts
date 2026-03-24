import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import { getProject } from "../../db/database.js";
import { getConfig } from "../../utils/config.js";
import { s_claudeUsageTitle, s_noUsageData, s_usageDescription, s_channelNotRegUsage, s_usageApiKeyMode, s_noAccessToken, s_fetchUsageFailed } from "../../i18n/strings.js";

const USAGE_API_URL = "https://api.anthropic.com/api/oauth/usage";

interface UsageResponse {
  [key: string]: unknown;
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
    .setTitle(s_claudeUsageTitle())
    .setColor(0x7c3aed)
    .setTimestamp();

  const entries = Object.entries(usage);
  if (entries.length === 0) {
    embed.setDescription(s_noUsageData());
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
  .setDescription(s_usageDescription());

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const channelId = interaction.channelId;
  const project = getProject(channelId);

  if (!project) {
    await interaction.editReply({ content: s_channelNotRegUsage() });
    return;
  }

  if ((project.auth_mode ?? "subscription") !== "subscription") {
    await interaction.editReply({ content: s_usageApiKeyMode() });
    return;
  }

  const token = getConfig().OAUTH_TOKEN;
  if (!token) {
    await interaction.editReply({ content: s_noAccessToken() });
    return;
  }

  try {
    const usage = await fetchUsage(token);
    const embed = buildUsageEmbed(usage);
    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await interaction.editReply({ content: s_fetchUsageFailed(msg) });
  }
}
