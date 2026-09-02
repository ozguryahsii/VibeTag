-- The note policy becomes the rating policy. Until now anyone could score a
-- member and the setting closed only the written note; App Review (1.2) read
-- "anyone can score you" as objectifying real people. The same column, the
-- same values, one more choice (NOBODY) — existing "my circle" choices carry
-- over untouched and now close the score as well as the note.
ALTER TABLE "User" RENAME COLUMN "commentPolicy" TO "ratingPolicy";

-- Whether the notes written about somebody show on their public profile.
-- On for everyone who exists today: nothing that was visible disappears
-- without its owner choosing so.
ALTER TABLE "User" ADD COLUMN "showComments" BOOLEAN NOT NULL DEFAULT true;
