import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Use import.meta.url to reliably find the bot root directory
// (dist/index.js -> dist/ -> botDir), regardless of process.cwd()
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LANG_FILE = path.join(__dirname, "..", ".tray-lang");

/**
 * Read the current language preference from .tray-lang file.
 * Returns "en" (default), "zh", or "kr".
 * Reads fresh from disk on each call so tray app changes take effect immediately.
 */
export function getCurrentLang(): "en" | "zh" | "kr" {
  try {
    const content = fs.readFileSync(LANG_FILE, "utf-8").trim();
    if (content === "kr") return "kr";
    if (content === "zh") return "zh";
    return "en";
  } catch {
    return "en";
  }
}

/**
 * Localization helper. Returns the string matching the current language.
 * Usage: L("Hello", "你好", "안녕하세요")
 */
export function L(en: string, zh: string, kr: string): string {
  const lang = getCurrentLang();
  if (lang === "zh") return zh;
  if (lang === "kr") return kr;
  return en;
}
