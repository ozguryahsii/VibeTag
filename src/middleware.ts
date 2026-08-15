import { NextResponse, type NextRequest } from "next/server";
import { INVITE_COOKIE, INVITE_COOKIE_MAX_AGE } from "@/lib/invite-cookie";

/**
 * Remembers which invite link brought a visitor in.
 *
 * This lives in middleware rather than in the /i/[code] page because Next
 * only allows cookie writes from a Server Action, Route Handler or here —
 * a page render cannot mutate the response.
 */
export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const match = req.nextUrl.pathname.match(/^\/i\/([A-Za-z0-9]{4,32})\/?$/);
  if (match) {
    res.cookies.set(INVITE_COOKIE, match[1].toLowerCase(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: INVITE_COOKIE_MAX_AGE,
    });
  }

  return res;
}

export const config = { matcher: "/i/:code*" };
