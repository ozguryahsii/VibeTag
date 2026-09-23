-- Nothing about a person is published until they say so.
--
-- App Review upheld guideline 1.2 a second time: the controls added on
-- 2026-09-02 were there, but a new account still arrived open to everyone
-- with its notes wall on, and a setting somebody has to go and find is not
-- consent. So the doors start closed.

ALTER TABLE "User" ALTER COLUMN "ratingPolicy" SET DEFAULT 'CIRCLE';
ALTER TABLE "User" ALTER COLUMN "showComments" SET DEFAULT false;

-- When they said, in as many words, that anyone may rate them. Never
-- cleared: closing the door again does not unsay it.
ALTER TABLE "User" ADD COLUMN "openRatingConsentAt" TIMESTAMP(3);

-- Existing accounts move to the new default too. Everybody on the app today
-- is here to test it, nobody has been asked the question yet, and an account
-- the reviewer opens must show what a new account shows. Anyone who wants
-- the open door can say so in Settings, which is the point.
UPDATE "User" SET "ratingPolicy" = 'CIRCLE' WHERE "ratingPolicy" = 'EVERYONE';
UPDATE "User" SET "showComments" = false WHERE "showComments" = true;
