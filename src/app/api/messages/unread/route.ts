import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { unreadMessageCount } from "@/lib/social";

export const dynamic = "force-dynamic";

/**
 * How many unread messages this person has, right now.
 *
 * The tab bar's badge is rendered by the (app) layout, and a layout does not
 * re-run on a client-side navigation — that is the whole point of layouts.
 * So reading a thread cleared the messages and left the badge sitting there
 * until the next full page load, which in the app shell can be a very long
 * time. The badge asks here instead, on every route change.
 *
 * Signed out is 0 rather than 401: this is decoration, and the layout above
 * it has already sent anyone unauthenticated to the sign-in screen.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ count: 0 });

  return NextResponse.json(
    { count: await unreadMessageCount(user.id) },
    { headers: { "cache-control": "no-store" } },
  );
}
