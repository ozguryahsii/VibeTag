-- Photos are managed in one box now.
--
-- Before this, the profile picture lived only on "User"."avatarUrl" and the
-- vault was a separate, newer thing. Anybody who set a picture the old way
-- therefore has an avatar with no row behind it: the box would show nothing
-- to change and nothing to delete, while the profile kept displaying it.
-- Give every such avatar its row, as that account's first photo.
INSERT INTO "ProfilePhoto" ("id", "userId", "url", "position", "createdAt")
SELECT gen_random_uuid()::text, u."id", u."avatarUrl", 0, CURRENT_TIMESTAMP
FROM "User" u
WHERE u."avatarUrl" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "ProfilePhoto" p
    WHERE p."userId" = u."id" AND p."url" = u."avatarUrl"
  );

-- One rule replaced two: a plan buys N photos, exactly one is the profile
-- picture, the rest are side circles. Nothing reads "showcase" any more.
ALTER TABLE "ProfilePhoto" DROP COLUMN "showcase";
