-- Per-side archive and delete for DM threads.
ALTER TABLE "Conversation" ADD COLUMN "archivedAAt" TIMESTAMP(3);
ALTER TABLE "Conversation" ADD COLUMN "archivedBAt" TIMESTAMP(3);
ALTER TABLE "Conversation" ADD COLUMN "deletedAAt" TIMESTAMP(3);
ALTER TABLE "Conversation" ADD COLUMN "deletedBAt" TIMESTAMP(3);

-- The photo vault.
CREATE TABLE "ProfilePhoto" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "showcase" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfilePhoto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProfilePhoto_userId_position_idx" ON "ProfilePhoto"("userId", "position");

ALTER TABLE "ProfilePhoto" ADD CONSTRAINT "ProfilePhoto_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
