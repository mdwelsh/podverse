-- This migration cleans up our RLS policies to be consistent across tables.
-- SpeakerMap insert.
ALTER POLICY "Allow insert by Podcast owner" ON "public"."SpeakerMap" TO public WITH CHECK (
    is_podcast_owner(episode, requesting_user_id())
);

-- SpeakerMap update.
ALTER POLICY "Allow insert or update by Podcast owner" ON "public"."SpeakerMap" TO public USING (
    is_podcast_owner(episode, requesting_user_id())
);

-- Add select policy for Jobs.
CREATE POLICY "Enable read access for all users" ON "public"."Jobs" FOR
SELECT
    USING (is_podcast_owner(episode, requesting_user_id()));

-- Add insert policy for Jobs.
CREATE POLICY "Allow insert for Podcast owner" ON "public"."Jobs" FOR
INSERT
    WITH CHECK (
        "public"."is_podcast_owner"("episode", "public"."requesting_user_id"())
    );

-- Add update policy for Jobs.
CREATE POLICY "Allow update for Podcast owner" ON "public"."Jobs" FOR
UPDATE
    USING (
        "public"."is_podcast_owner"("episode", "public"."requesting_user_id"())
    );