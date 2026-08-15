/**
 * Shared between the middleware (edge runtime) and the server modules, so it
 * must stay free of any Node/Prisma import.
 */
export const INVITE_COOKIE = "vt_invite";
export const INVITE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
