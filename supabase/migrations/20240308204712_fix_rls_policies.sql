-- This migration fixes a bunch of RLS policies that were broken.
-- --------------------------------------------------------------------------------
-- Functions
-- --------------------------------------------------------------------------------
-- Function to test if a podcast if owned by a given user, with the podcast ID.
-- (is_podcast_owner takes an episode ID.)

CREATE OR REPLACE FUNCTION
"public"."is_podcast_owner"("episodeid" bigint, "userid" "text")
RETURNS boolean
LANGUAGE "plpgsql" AS $$
#variable_conflict use_variable
begin
  return (
  select EXISTS (
    SELECT 1
    FROM "Episodes" e
    JOIN "Podcasts" p ON p.id = e.podcast
    WHERE e.id = "episodeid"
    AND p.owner = "userid"
  ) );
end;
$$;

CREATE OR REPLACE FUNCTION
"public"."is_podcast_owner_with_podcast_id"("podcastId" bigint, "userid" "text")
RETURNS boolean
LANGUAGE "plpgsql" AS $$
#variable_conflict use_variable
begin return (
    select EXISTS (
        SELECT 1
        FROM "Podcasts" p
        WHERE p.id = "podcastId" AND p.owner = "userid"
    )
);
end;
$$;

DROP FUNCTION chunk_vector_search;

CREATE OR REPLACE FUNCTION chunk_vector_search(embedding vector(1536), match_threshold float, match_count int, min_content_length int)
RETURNS TABLE (id bigint, document bigint, meta jsonb, content text, similarity float)
language plpgsql
as $$
#variable_conflict use_variable
begin
  return query
  select
    "Chunks".id,
    "Chunks".document,
    "Chunks".meta,
    "Chunks".content,
    ("Chunks".embedding <#> embedding) * -1 as similarity
  from "Chunks"

  -- We only care about sections that have a useful amount of content
  where length("Chunks".content) >= min_content_length

  -- The dot product is negative because of a Postgres limitation, so we negate it
  and ("Chunks".embedding <#> embedding) * -1 > match_threshold

  -- OpenAI embeddings are normalized to length 1, so
  -- cosine similarity and dot product will produce the same results.
  -- Using dot product which can be computed slightly faster.
  --
  -- For the different syntaxes, see https://github.com/pgvector/pgvector
  order by "Chunks".embedding <#> embedding

  limit match_count;
end;
$$;

-- --------------------------------------------------------------------------------
-- Podcasts
-- --------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow insert by any authed user" ON "public"."Podcasts";

DROP POLICY IF EXISTS "Allow update by Podcast owner" ON "public"."Podcasts";

DROP POLICY IF EXISTS "Allow delete by Podcast owner" ON "public"."Podcasts";

DROP POLICY IF EXISTS "Allow read access for all users" ON "public"."Podcasts";

CREATE POLICY "Allow read access for all users" ON "public"."Podcasts" FOR
SELECT
    TO public USING (true);

CREATE POLICY "Allow insert by any authed user" ON "public"."Podcasts" TO public WITH CHECK ((requesting_user_id() <> '' :: text));

CREATE POLICY "Allow update by Podcast owner" ON "public"."Podcasts" TO public USING ((requesting_user_id() = owner));

CREATE POLICY "Allow delete by Podcast owner" ON "public"."Podcasts" TO public USING ((requesting_user_id() = owner));

-- --------------------------------------------------------------------------------
-- Episodes
-- --------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow insert by Podcast owner" ON "public"."Episodes";

DROP POLICY IF EXISTS "Allow update by Podcast owner" ON "public"."Episodes";

DROP POLICY IF EXISTS "Allow delete by Podcast owner" ON "public"."Episodes";

DROP POLICY IF EXISTS "Allow read access for all users" ON "public"."Episodes";

CREATE POLICY "Allow read access for all users" ON "public"."Episodes" FOR
SELECT
    TO public USING (true);

CREATE POLICY "Allow insert by Podcast owner" ON "public"."Episodes" FOR
INSERT
    TO public WITH CHECK (
        is_podcast_owner_with_podcast_id(podcast, requesting_user_id())
    );

CREATE POLICY "Allow update by Podcast owner" ON "public"."Episodes" FOR
UPDATE
    TO public USING (
        is_podcast_owner_with_podcast_id(podcast, requesting_user_id())
    );

CREATE POLICY "Allow delete by Podcast owner" ON "public"."Episodes" FOR DELETE TO public USING (
    is_podcast_owner_with_podcast_id(podcast, requesting_user_id())
);

-- --------------------------------------------------------------------------------
-- Jobs
-- --------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow insert by Podcast owner" ON "public"."Jobs";

DROP POLICY IF EXISTS "Allow update by Podcast owner" ON "public"."Jobs";

DROP POLICY IF EXISTS "Allow delete by Podcast owner" ON "public"."Jobs";

DROP POLICY IF EXISTS "Allow read access by Podcast owner" ON "public"."Jobs";

CREATE POLICY "Allow read access by Podcast owner" ON "public"."Jobs" FOR
SELECT
    TO public USING (
        is_podcast_owner(episode, requesting_user_id())
    );

CREATE POLICY "Allow insert by Podcast owner" ON "public"."Jobs" FOR
INSERT
    TO public WITH CHECK (
        is_podcast_owner(episode, requesting_user_id())
    );

CREATE POLICY "Allow update by Podcast owner" ON "public"."Jobs" FOR
UPDATE
    TO public USING (
        is_podcast_owner(episode, requesting_user_id())
    );

CREATE POLICY "Allow delete by Podcast owner" ON "public"."Jobs" FOR DELETE TO public USING (
    is_podcast_owner(episode, requesting_user_id())
);

-- --------------------------------------------------------------------------------
-- SpeakerMap
-- --------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow insert by Podcast owner" ON "public"."SpeakerMap";

DROP POLICY IF EXISTS "Allow update by Podcast owner" ON "public"."SpeakerMap";

DROP POLICY IF EXISTS "Allow delete by Podcast owner" ON "public"."SpeakerMap";

DROP POLICY IF EXISTS "Allow read access for all users" ON "public"."SpeakerMap";

CREATE POLICY "Allow read access for all users" ON "public"."SpeakerMap" FOR
SELECT
    TO public USING (true);

CREATE POLICY "Allow insert by Podcast owner" ON "public"."SpeakerMap" FOR
INSERT
    TO public WITH CHECK (
        is_podcast_owner(episode, requesting_user_id())
    );

CREATE POLICY "Allow update by Podcast owner" ON "public"."SpeakerMap" FOR
UPDATE
    TO public USING (
        is_podcast_owner(episode, requesting_user_id())
    );

CREATE POLICY "Allow delete by Podcast owner" ON "public"."SpeakerMap" FOR DELETE TO public USING (
    is_podcast_owner(episode, requesting_user_id())
);

-- --------------------------------------------------------------------------------
-- Documents
-- --------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow deletion by Podcast owner" ON "public"."Documents";

DROP POLICY IF EXISTS "Allow update by Podcast owner" ON "public"."Documents";

DROP POLICY IF EXISTS "Allow delete by Podcast owner" ON "public"."Documents";

DROP POLICY IF EXISTS "Allow insert by Podcast owner" ON "public"."Documents";

DROP POLICY IF EXISTS "Allow read access for all users" ON "public"."Documents";

CREATE POLICY "Allow read access for all users" ON "public"."Documents" FOR
SELECT
    TO public USING (true);

CREATE POLICY "Allow insert by Podcast owner" ON "public"."Documents" FOR
INSERT
    TO public WITH CHECK (
        is_podcast_owner(episode, requesting_user_id())
    );

CREATE POLICY "Allow update by Podcast owner" ON "public"."Documents" FOR
UPDATE
    TO public USING (
        is_podcast_owner(episode, requesting_user_id())
    );

CREATE POLICY "Allow delete by Podcast owner" ON "public"."Documents" FOR DELETE TO public USING (
    is_podcast_owner(episode, requesting_user_id())
);

-- --------------------------------------------------------------------------------
-- Chunks
-- --------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow delete by Podcast owner" ON "public"."Chunks";

DROP POLICY IF EXISTS "Allow insert by Podcast owner" ON "public"."Chunks";

DROP POLICY IF EXISTS "Allow read access for all users" ON "public"."Chunks";

CREATE POLICY "Allow read access for all users" ON "public"."Chunks" FOR
SELECT
    TO public USING (true);

CREATE POLICY "Allow insert by Podcast owner" ON "public"."Chunks" FOR
INSERT
    TO public WITH CHECK (
        is_podcast_owner(
            (
                SELECT
                    d.episode
                FROM
                    "Documents" d
                WHERE
                    (d.id = document)
            ),
            requesting_user_id()
        )
    );

CREATE POLICY "Allow delete by Podcast owner" ON "public"."Chunks" FOR DELETE TO public USING (
    is_podcast_owner(
        (
            SELECT
                d.episode
            FROM
                "Documents" d
            WHERE
                (d.id = document)
        ),
        requesting_user_id()
    )
);

-- --------------------------------------------------------------------------------
-- Storage policies
-- --------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow select by Podcast owner" ON "storage"."objects";

DROP POLICY IF EXISTS "Allow insert by Podcast owner" ON "storage"."objects";

DROP POLICY IF EXISTS "Allow update by Podcast owner" ON "storage"."objects";

DROP POLICY IF EXISTS "Allow delete by Podcast owner" ON "storage"."objects";

CREATE POLICY "Allow select by Podcast owner" ON "storage"."objects" FOR
SELECT
    TO public USING (
        (
            (bucket_id IN ('transcripts', 'summaries'))
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
            (bucket_id IN ('transcripts', 'summaries'))
            AND is_podcast_owner_with_podcast_id(
                ((storage.foldername(name)) [1]) :: bigint,
                requesting_user_id()
            )
        )
    );

CREATE POLICY "Allow update by Podcast owner" ON "storage"."objects" FOR
UPDATE
    TO public USING (
        (
            (bucket_id IN ('transcripts', 'summaries'))
            AND is_podcast_owner_with_podcast_id(
                ((storage.foldername(name)) [1]) :: bigint,
                requesting_user_id()
            )
        )
    );

CREATE POLICY "Allow delete by Podcast owner" ON "storage"."objects" FOR DELETE TO public USING (
    (
        (bucket_id IN ('transcripts', 'summaries'))
        AND is_podcast_owner_with_podcast_id(
            ((storage.foldername(name)) [1]) :: bigint,
            requesting_user_id()
        )
    )
);