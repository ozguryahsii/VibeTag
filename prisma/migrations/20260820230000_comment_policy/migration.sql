-- Ratings are now open to everyone; the policy gates only the written note.
-- A rename, not drop-and-add: every existing choice must survive.
ALTER TABLE "User" RENAME COLUMN "ratingPolicy" TO "commentPolicy";
