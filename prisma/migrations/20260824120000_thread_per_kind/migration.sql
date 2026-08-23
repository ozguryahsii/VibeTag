-- A friend thread and a rating thread between the same two people are two
-- different conversations.
--
-- They used to be one row: the pair was unique, and both entry points upserted
-- into it. Whichever was created first owned the pair, so tapping "message" on
-- a friend could drop you into their anonymous rating thread — which names the
-- anonymous rater by navigation — and opening a rating thread with someone you
-- were already friends with printed their real name in the header.
--
-- Widening the key is non-destructive: every existing row was already unique on
-- the narrower key, so none of them collide on the wider one.
DROP INDEX "Conversation_userAId_userBId_key";
CREATE UNIQUE INDEX "Conversation_userAId_userBId_kind_key"
  ON "Conversation"("userAId", "userBId", "kind");
