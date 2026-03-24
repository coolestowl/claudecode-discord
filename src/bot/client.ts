import {
  Client,
  GatewayIntentBits,
  Collection,
  type ChatInputCommandInteraction,
  type Interaction,
} from "discord.js";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getConfig } from "../utils/config.js";
import { handleMessage } from "./handlers/message.js";
import { handleButtonInteraction, handleSelectMenuInteraction } from "./handlers/interaction.js";
import { isAllowedUser } from "../security/guard.js";
import { s_notAuthorized, s_commandError, s_messageError } from "../i18n/strings.js";

const COMMAND_CACHE_FILE = join(process.cwd(), ".command-cache.json");

function getCommandHash(commandData: unknown[]): string {
  return createHash("sha256").update(JSON.stringify(commandData)).digest("hex");
}

function loadCachedHash(): string | null {
  try {
    const cache = JSON.parse(readFileSync(COMMAND_CACHE_FILE, "utf8")) as { hash?: string };
    return cache.hash ?? null;
  } catch {
    return null;
  }
}

function saveCachedHash(hash: string): void {
  writeFileSync(COMMAND_CACHE_FILE, JSON.stringify({ hash }), "utf8");
}

// Import commands
import * as unregisterCmd from "./commands/unregister.js";
import * as statusCmd from "./commands/status.js";
import * as stopCmd from "./commands/stop.js";
import * as autoApproveCmd from "./commands/auto-approve.js";
import * as sessionsCmd from "./commands/sessions.js";
import * as clearSessionsCmd from "./commands/clear-sessions.js";
import * as lastCmd from "./commands/last.js";
import * as queueCmd from "./commands/queue.js";
import * as initCmd from "./commands/init.js";
import * as authModeCmd from "./commands/auth-mode.js";
import * as modelCmd from "./commands/model.js";
import * as newSessionCmd from "./commands/new-session.js";
import * as usageCmd from "./commands/usage.js";
import * as cmdCmd from "./commands/cmd.js";

const commands = [unregisterCmd, statusCmd, stopCmd, autoApproveCmd, sessionsCmd, clearSessionsCmd, lastCmd, queueCmd, initCmd, authModeCmd, modelCmd, newSessionCmd, usageCmd, cmdCmd];
const commandMap = new Collection<
  string,
  { execute: (interaction: ChatInputCommandInteraction) => Promise<void> }
>();

for (const cmd of commands) {
  commandMap.set(cmd.data.name, cmd);
}

export async function startBot(): Promise<Client> {
  const config = getConfig();

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  // Register slash commands after successful login (network guaranteed)
  client.on("ready", async () => {
    console.log(`Bot logged in as ${client.user?.tag}`);
    try {
      const TIMEOUT_MS = 15_000;
      const token = config.DISCORD_BOT_TOKEN;
      const commandData = commands.map((c) => c.data.toJSON());
      const currentHash = getCommandHash(commandData);
      const cachedHash = loadCachedHash();

      if (currentHash === cachedHash) {
        console.log("[register] Commands unchanged, skipping registration.");
        return;
      }

      // Fetch app ID via plain fetch — bypasses @discordjs/rest internal queue
      console.log("[register] Fetching application ID...");
      const meRes = await fetch("https://discord.com/api/v10/applications/@me", {
        headers: { Authorization: `Bot ${token}` },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!meRes.ok) throw new Error(`GET /applications/@me → HTTP ${meRes.status}: ${await meRes.text()}`);
      const { id: appId } = await meRes.json() as { id: string };
      console.log(`[register] App ID: ${appId}`);

      console.log(`[register] Registering ${commandData.length} slash commands to guild ${config.DISCORD_GUILD_ID}...`);
      const putRes = await fetch(
        `https://discord.com/api/v10/applications/${appId}/guilds/${config.DISCORD_GUILD_ID}/commands`,
        {
          method: "PUT",
          headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(commandData),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        },
      );
      if (!putRes.ok) throw new Error(`PUT /guilds/.../commands → HTTP ${putRes.status}: ${await putRes.text()}`);

      saveCachedHash(currentHash);
      console.log(`[register] Done — ${commandData.length} slash commands registered.`);
    } catch (error) {
      console.error("[register] Failed to register slash commands:", error);
    }
  });

  // Handle interactions (slash commands + buttons)
  client.on("interactionCreate", async (interaction: Interaction) => {
    try {
      if (interaction.isAutocomplete()) {
        const command = commandMap.get(interaction.commandName);
        if (command && "autocomplete" in command) {
          await (command as any).autocomplete(interaction);
        }
        return;
      }

      if (interaction.isChatInputCommand()) {
        // Auth check
        if (!isAllowedUser(interaction.user.id)) {
          await interaction.reply({
            content: s_notAuthorized(),
            flags: ["Ephemeral"],
          });
          return;
        }

        // Defer reply to avoid 3-second timeout
        await interaction.deferReply();

        const command = commandMap.get(interaction.commandName);
        if (command) {
          await command.execute(interaction);
        }
      } else if (interaction.isButton()) {
        await handleButtonInteraction(interaction);
      } else if (interaction.isStringSelectMenu()) {
        await handleSelectMenuInteraction(interaction);
      }
    } catch (error) {
      console.error("Interaction error:", error);
      const content = s_commandError();
      try {
        if (interaction.isRepliable()) {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content, flags: ["Ephemeral"] });
          } else {
            await interaction.reply({ content, flags: ["Ephemeral"] });
          }
        }
      } catch {
        // ignore follow-up errors
      }
    }
  });

  // Handle messages (wrapped with error handler to prevent silent hangs)
  client.on("messageCreate", async (message) => {
    try {
      await handleMessage(message);
    } catch (error) {
      console.error("messageCreate error:", error);
      try {
        if (message.channel.isSendable()) {
          await message.reply(s_messageError());
        }
      } catch {
        // ignore reply error
      }
    }
  });

  // Discord.js error handlers — prevent silent disconnects
  client.on("error", (error) => {
    console.error("Discord client error:", error);
  });

  client.on("warn", (warning) => {
    console.warn("Discord warning:", warning);
  });

  client.on("shardDisconnect", (event, shardId) => {
    console.warn(`Shard ${shardId} disconnected (code ${event.code}). Reconnecting...`);
  });

  client.on("shardReconnecting", (shardId) => {
    console.log(`Shard ${shardId} reconnecting...`);
  });

  client.on("shardResume", (shardId, replayedEvents) => {
    console.log(`Shard ${shardId} resumed (${replayedEvents} events replayed)`);
  });

  client.on("shardError", (error, shardId) => {
    console.error(`Shard ${shardId} error:`, error);
  });

  // Login with retry (network may not be ready on boot)
  await loginWithRetry(client, config.DISCORD_BOT_TOKEN);
  return client;
}

async function loginWithRetry(client: Client, token: string): Promise<void> {
  const delays = [5, 10, 15, 30, 30, 30]; // seconds — escalating, then steady 30s
  let attempt = 0;

  while (true) {
    try {
      await client.login(token);
      if (attempt > 0) {
        console.log(`Discord login successful after ${attempt} retries`);
      }
      return;
    } catch (error) {
      attempt++;
      const delay = delays[Math.min(attempt - 1, delays.length - 1)];
      console.error(`Discord login attempt ${attempt} failed: ${(error as Error).message}`);
      console.error(`Retrying in ${delay}s...`);
      await new Promise(resolve => setTimeout(resolve, delay * 1000));
    }
  }
}
