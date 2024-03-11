-- This migration adds the status field to the Episode table.

ALTER TABLE "public"."Episodes"
ADD status JSONB;
