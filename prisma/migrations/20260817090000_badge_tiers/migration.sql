-- DropIndex
DROP INDEX "EarnedBadge_userId_key_key";

-- AlterTable
ALTER TABLE "EarnedBadge" ADD COLUMN     "tier" TEXT NOT NULL DEFAULT 'BRONZE';

-- CreateIndex
CREATE UNIQUE INDEX "EarnedBadge_userId_key_tier_key" ON "EarnedBadge"("userId", "key", "tier");

