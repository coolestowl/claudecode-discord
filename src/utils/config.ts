import { z } from "zod";

const envSchema = z.object({
  DISCORD_BOT_TOKEN: z.string().min(1, "DISCORD_BOT_TOKEN is required"),
  DISCORD_GUILD_ID: z.string().min(1, "DISCORD_GUILD_ID is required"),
  ALLOWED_USER_IDS: z
    .string()
    .min(1, "ALLOWED_USER_IDS is required")
    .transform((v) => v.split(",").map((id) => id.trim())),
  BASE_PROJECT_DIR: z.string().min(1, "BASE_PROJECT_DIR is required"),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(10),
  SHOW_COST: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  AVAILABLE_MODELS: z
    .string()
    .default("sonnet:claude-sonnet-4-5-20250929,opus:claude-opus-4-20250514,haiku:claude-haiku-4-5-20251001")
    .transform((v) =>
      v.split(",").map((entry) => {
        const [name, value] = entry.trim().split(":");
        return { name: name.trim(), value: value?.trim() ?? name.trim() };
      }),
    ),
  // Coder workspace integration
  CODER_REMOTE_HOME: z.string().default("/home/coder"),
  CODER_SSH_SUFFIX: z.string().default(".coder"),
  // Comma-separated key=value pairs forwarded as a single --parameter to `coder create`
  // e.g. "region=us-east-1,size=large"
  CODER_CREATE_PARAMETERS: z.string().optional(),
  // Long-lived Claude Code OAuth token for subscription mode.
  // Passed as CLAUDE_CODE_OAUTH_TOKEN to the claude process, and used by /usage to query the API.
  OAUTH_TOKEN: z.string().optional(),
});

export type Config = z.infer<typeof envSchema>;

let _config: Config | null = null;

export function loadConfig(): Config {
  if (_config) return _config;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    console.error(`Configuration error:\n${errors}`);
    process.exit(1);
  }

  _config = result.data;
  return _config;
}

export function getConfig(): Config {
  if (!_config) return loadConfig();
  return _config;
}

// Collect available models for API key mode from the API key env vars.
// Returns unique non-empty values found across all model-related env vars.
export function getApiKeyModels(): { name: string; value: string }[] {
  const keys = [
    "ANTHROPIC_MODEL",
    "ANTHROPIC_DEFAULT_SONNET_MODEL",
    "ANTHROPIC_SMALL_FAST_MODEL",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL",
  ];
  const seen = new Set<string>();
  const models: { name: string; value: string }[] = [];
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value && !seen.has(value)) {
      seen.add(value);
      models.push({ name: value, value });
    }
  }
  return models;
}
