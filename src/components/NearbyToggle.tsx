"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveLocationAction, type LocationState } from "@/lib/actions/location";
import { useD } from "@/components/LocaleProvider";

/**
 * Asks the browser for a position, then hands it to the server action.
 * The permission prompt only ever appears because the person tapped this.
 */
export function NearbyToggle({ inShell = false }: { inShell?: boolean }) {
  const d = useD();
  const [state, action, pending] = useActionState<LocationState, FormData>(
    saveLocationAction,
    {},
  );
  const [status, setStatus] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // One choice, used by both the refusal we hear from the browser and the
  // one that comes back from the server action.
  const denied = inShell ? d.people.nearbyDeniedApp : d.people.nearbyDenied;

  function ask() {
    if (!("geolocation" in navigator)) {
      setStatus(d.people.nearbyUnsupported);
      return;
    }
    setStatus(d.people.nearbyAsking);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStatus(null);
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      // "Allow it in your browser settings" is advice with no address inside
      // the app — there is no browser to open. Same fix the notification
      // toggle already carries.
      () => setStatus(denied),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 },
    );
  }

  return (
    <div className="card p-5">
      <p className="text-[13.5px] font-extrabold">{d.people.nearbyOn}</p>
      <p className="text-[12px] text-muted leading-relaxed mt-1">
        {d.people.nearbyBody}
      </p>
      {/*
       * Location is the one thing here that rests on explicit consent rather
       * than on the contract, so the ask says so in as many words and links to
       * the text that explains it. KVKK m.5/1.
       */}
      <p className="text-[11.5px] text-muted/90 leading-relaxed mt-2">
        {d.people.nearbyConsent}{" "}
        <Link href="/legal/kvkk" className="font-bold text-orange">
          {d.people.nearbyConsentLink}
        </Link>
      </p>

      {coords ? (
        <form action={action} className="mt-3.5">
          <input type="hidden" name="lat" value={coords.lat} />
          <input type="hidden" name="lng" value={coords.lng} />
          <button
            type="submit"
            disabled={pending}
            className="h-11 w-full rounded-full grad-score text-white font-bold text-[13.5px] disabled:opacity-50"
          >
            {pending ? d.common.saving : d.people.nearbyEnable}
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={ask}
          className="mt-3.5 h-11 w-full rounded-full grad-score text-white font-bold text-[13.5px]"
        >
          {d.people.nearbyEnable}
        </button>
      )}

      {(status || state.error) && (
        <p
          data-testid="nearby-status"
          className="mt-2.5 text-[12px] font-semibold text-muted"
        >
          {status ?? denied}
        </p>
      )}
    </div>
  );
}
