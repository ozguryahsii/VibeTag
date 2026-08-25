-- A native app install that can receive push.
--
-- Kept apart from "PushSubscription": a Web Push subscription is a browser
-- object addressed by an endpoint URL, this is an APNs/FCM device token
-- addressed by an opaque string. One table for both would mean columns that
-- are meaningless for half the rows.
CREATE TABLE "DeviceToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

-- Unique across accounts rather than per account. A phone handed on to
-- somebody else keeps its token, so the row is re-pointed at whoever signed
-- in last; two accounts sharing one token would mean one person receiving the
-- other's notifications.
CREATE UNIQUE INDEX "DeviceToken_token_key" ON "DeviceToken"("token");

CREATE INDEX "DeviceToken_userId_idx" ON "DeviceToken"("userId");

ALTER TABLE "DeviceToken" ADD CONSTRAINT "DeviceToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
