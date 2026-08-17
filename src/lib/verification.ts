/**
 * Ways an account can be proven to belong to a real person.
 *
 * Three of them, only one of which exists today. The other two are declared
 * anyway, and shown as "coming soon" rather than hidden: a badge shelf that
 * silently grows new rows later teaches people to stop looking at it, and a
 * locked door you can see is a better invitation than a wall.
 *
 * Progress is deliberately absent here. A verification is passed or it is not;
 * a bar creeping towards "63% verified" would be a lie about a yes/no fact.
 */

export const VERIFICATIONS = [
  {
    key: "email",
    icon: "envelope",
    /** Offered today. */
    available: true,
  },
  {
    key: "phone",
    icon: "message",
    /** Needs an SMS provider. */
    available: false,
  },
  {
    key: "identity",
    icon: "fingerprint",
    /** Needs a document-checking service. */
    available: false,
  },
] as const;

export type Verification = (typeof VERIFICATIONS)[number];
export type VerificationKey = Verification["key"];

export type VerificationState = {
  key: VerificationKey;
  icon: string;
  available: boolean;
  earned: boolean;
  at: Date | null;
};

type VerifiableUser = {
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
  idVerifiedAt: Date | null;
};

export function verificationState(user: VerifiableUser): VerificationState[] {
  const at: Record<VerificationKey, Date | null> = {
    email: user.emailVerifiedAt,
    phone: user.phoneVerifiedAt,
    identity: user.idVerifiedAt,
  };

  return VERIFICATIONS.map((v) => ({
    key: v.key,
    icon: v.icon,
    available: v.available,
    earned: at[v.key] !== null,
    at: at[v.key],
  }));
}

/** How many of the offered verifications this account holds, and out of how many. */
export function verificationCount(user: VerifiableUser): {
  held: number;
  offered: number;
} {
  const state = verificationState(user);
  return {
    held: state.filter((v) => v.earned).length,
    offered: state.filter((v) => v.available).length,
  };
}
