-- The two closed note policies merge into one: "people I invited AND my
-- friends" is a single circle. Existing choices fold into it — nobody who
-- closed their notes wakes up with them open.
UPDATE "User" SET "commentPolicy" = 'CIRCLE' WHERE "commentPolicy" IN ('INVITED', 'FRIENDS');
