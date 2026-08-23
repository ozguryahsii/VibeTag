/**
 * The token the mobile shell appends to its user agent.
 *
 * One constant, imported by both sides of the contract: the server helper
 * that reads it and the Capacitor config that writes it (mobile/ appends
 * this exact string via `appendUserAgent`). Pure so it can be tested.
 */
export const SHELL_UA_TOKEN = "VibeTagShell";

export function isShellUserAgent(ua: string | null | undefined): boolean {
  return !!ua && ua.includes(SHELL_UA_TOKEN);
}
