-- This migration adds RLS policies for a new "audio" bucket, as well as a
-- new "originalAudioUrl" field to the "Episodes" table.

-- Update RLS policies for storage buckets to include audio.

DROP POLICY IF EXISTS "Allow select by Podcast owner" ON "storage"."objects";

DROP POLICY IF EXISTS "Allow insert by Podcast owner" ON "storage"."objects";

DROP POLICY IF EXISTS "Allow update by Podcast owner" ON "storage"."objects";

DROP POLICY IF EXISTS "Allow delete by Podcast owner" ON "storage"."objects";

CREATE POLICY "Allow select by Podcast owner" ON "storage"."objects" FOR
SELECT
    TO public USING (
        (
            (bucket_id IN ('transcripts', 'summaries', 'audio'))
            AND is_podcast_owner_with_podcast_id(
                ((storage.foldername(name)) [1]) :: bigint,
                requesting_user_id()
            )
        )
    );

CREATE POLICY "Allow insert by Podcast owner" ON "storage"."objects" FOR
INSERT
    TO public WITH CHECK (
        (
            (bucket_id IN ('transcripts', 'summaries', 'audio'))
            AND is_podcast_owner_with_podcast_id(
                ((storage.foldername(name)) [1]) :: bigint,
                requesting_user_id()
            )
        )
    );

-- Add originalAudioUrl field to Episodes.
ALTER TABLE "public"."Episodes" ADD COLUMN "originalAudioUrl" text;

-- Add published field to Episodes.
ALTER TABLE "public"."Episodes" ADD COLUMN "published" boolean DEFAULT false;