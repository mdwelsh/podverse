-- This migration adds insert and update policies for Episodes and Podcasts.

-- Add insert policy for Podcasts.
CREATE POLICY "Allow insert on Podcasts when requesting_user_id() is not empty" ON "public"."Podcasts"
FOR INSERT WITH CHECK ((requesting_user_id() <> ''::"text"));

-- Add update policy for Podcasts.
CREATE POLICY "Allow update for Podcast owner" ON "public"."Podcasts" FOR
UPDATE
    USING (requesting_user_id() = owner);

-- Function to test if a podcast if owned by a given user, with the podcast ID.
-- (is_podcast_owner takes an episode ID.)
CREATE OR REPLACE FUNCTION "public"."is_podcast_owner_with_podcast_id"("podcastId" bigint, "userid" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$#variable_conflict use_variable
begin
  return (
  select EXISTS (
    SELECT 1
    FROM "Podcasts" p
    WHERE p.id = podcastId
    AND p.owner = userId
  ) );
end;
$$;

ALTER FUNCTION "public"."is_podcast_owner_with_podcast_id"("podcastId" bigint, "userid" "text") OWNER TO "postgres";

-- Add insert policy for Episodes.
CREATE POLICY "Allow insert for Podcast owner" ON "public"."Episodes" FOR
INSERT
    WITH CHECK (
        "public"."is_podcast_owner_with_podcast_id"("podcast", "public"."requesting_user_id"())
    );

-- Add update policy for Episodes.
CREATE POLICY "Allow update for Podcast owner" ON "public"."Episodes" FOR
UPDATE
    USING (
        "public"."is_podcast_owner_with_podcast_id"("podcast", "public"."requesting_user_id"())
    );