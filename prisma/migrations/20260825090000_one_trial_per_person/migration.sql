-- One free trial per person, for the lifetime of the account.
--
-- A week of Silver followed by a week of Gold is two free weeks, which is not
-- what a trial is for. Recording when the trial was spent — and on which plan
-- — is what lets the membership screen stop offering a second one, and is the
-- app's own answer independent of whatever each store happens to enforce.
--
-- Nullable with no default: every existing account is treated as still
-- eligible, which is the generous reading and the only one that does not
-- silently take something away from people who already signed up.
ALTER TABLE "User" ADD COLUMN "trialConsumedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "trialPlan" TEXT;
