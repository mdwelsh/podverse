-- This migration adds the Suggestions table.
CREATE TABLE IF NOT EXISTS "public"."Suggestions" (
    "id" bigint NOT NULL,
    "episode" bigint NOT NULL,
    "suggestion" "text"
);

ALTER TABLE
    "public"."Suggestions" OWNER TO "postgres";

ALTER TABLE
    ONLY "public"."Suggestions"
ADD
    CONSTRAINT "public_Suggestions_episode_fkey" FOREIGN KEY ("episode") REFERENCES "public"."Episodes"("id") ON UPDATE CASCADE ON DELETE CASCADE;

DROP POLICY IF EXISTS "Allow deletion by Podcast owner" ON "public"."Suggestions";

DROP POLICY IF EXISTS "Allow update by Podcast owner" ON "public"."Suggestions";

DROP POLICY IF EXISTS "Allow delete by Podcast owner" ON "public"."Suggestions";

DROP POLICY IF EXISTS "Allow insert by Podcast owner" ON "public"."Suggestions";

DROP POLICY IF EXISTS "Allow read access for all users" ON "public"."Suggestions";

CREATE POLICY "Allow read access for all users" ON "public"."Suggestions" FOR
SELECT
    TO public USING (true);

CREATE POLICY "Allow insert by Podcast owner" ON "public"."Suggestions" FOR
INSERT
    TO public WITH CHECK (
        is_podcast_owner(episode, requesting_user_id())
    );

CREATE POLICY "Allow update by Podcast owner" ON "public"."Suggestions" FOR
UPDATE
    TO public USING (
        is_podcast_owner(episode, requesting_user_id())
    );

CREATE POLICY "Allow delete by Podcast owner" ON "public"."Suggestions" FOR DELETE TO public USING (
    is_podcast_owner(episode, requesting_user_id())
);