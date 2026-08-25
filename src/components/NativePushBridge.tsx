"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  attachPushListeners,
  refreshRegistration,
  setPushNavigator,
} from "@/components/native-push";

/**
 * Everything push needs to happen once per app launch, mounted app-wide.
 *
 * Two jobs, both invisible:
 *
 * 1. **Taps land somewhere.** A notification carries the screen it is about,
 *    and without a listener for the tap the app just opens wherever it was —
 *    a message notification that drops you on the home screen reads as the
 *    notification having done nothing.
 *
 * 2. **The token stays current.** APNs issues a new one after a reinstall or
 *    a device restore. An install that registered once and never again goes
 *    quietly unreachable, with the switch in settings still reading "on".
 *
 * Renders nothing, and does nothing at all outside the shell.
 */
export function NativePushBridge() {
  const router = useRouter();

  useEffect(() => {
    setPushNavigator((url) => router.push(url));
    attachPushListeners();
    void refreshRegistration();
  }, [router]);

  return null;
}
