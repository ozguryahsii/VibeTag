import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { removeDeviceToken, saveDeviceToken } from "@/lib/push";
import { isDevicePlatform, normalizeDeviceToken } from "@/lib/device-push";

/**
 * Register this app install for push.
 *
 * Separate from /api/push/subscribe: that one takes a Web Push subscription
 * object from a browser, this one takes an APNs or FCM device token from the
 * native shell. Same idea, different protocol, and nothing shared between the
 * two payloads worth merging.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    token?: unknown;
    platform?: unknown;
  } | null;

  if (!isDevicePlatform(body?.platform)) {
    return NextResponse.json({ error: "bad platform" }, { status: 400 });
  }
  const token = normalizeDeviceToken(body?.token, body.platform);
  if (!token) {
    return NextResponse.json({ error: "bad token" }, { status: 400 });
  }

  await saveDeviceToken(user.id, body.platform, token);
  return NextResponse.json({ ok: true });
}

/** Unregister it — used when someone signs out of the app on this device. */
export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    token?: unknown;
    platform?: unknown;
  } | null;

  if (!isDevicePlatform(body?.platform)) {
    return NextResponse.json({ error: "bad platform" }, { status: 400 });
  }
  const token = normalizeDeviceToken(body?.token, body.platform);
  if (!token) {
    return NextResponse.json({ error: "bad token" }, { status: 400 });
  }

  await removeDeviceToken(token);
  return NextResponse.json({ ok: true });
}
