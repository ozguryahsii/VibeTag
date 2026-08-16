/**
 * The address a person writes to when the app has done something to them —
 * a suspension, a data request. It is configurable because it has to be an
 * inbox somebody actually reads, and hard-coding one guarantees it is not.
 */
export const SUPPORT_EMAIL =
  process.env.SUPPORT_EMAIL?.trim() || "destek@vibetag.app";
