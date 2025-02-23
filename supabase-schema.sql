-- This file was created using `supabase db dump`.

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE SCHEMA IF NOT EXISTS "public";

ALTER SCHEMA "public" OWNER TO "pg_database_owner";

CREATE OR REPLACE FUNCTION "public"."all_podcasts"("limit" integer, "isPrivate" boolean, "isPublished" boolean) RETURNS TABLE("id" bigint, "title" "text", "description" "text", "slug" "text", "private" boolean, "published" boolean, "imageUrl" "text", "newestEpisode" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$#variable_conflict use_variable
begin
  return query

select p.id, p.title, p.description, p.slug, p.private, p.published, p."imageUrl", e."pubDate" as "newestEpisode"
from
  "Podcasts" p
JOIN (
  select DISTINCT ON (podcast)
    id, podcast, "pubDate"
  FROM "Episodes"
  ORDER BY podcast, "pubDate" DESC
) e
ON e.podcast = p.id
WHERE p.private = "isPrivate"
order by "newestEpisode" DESC
LIMIT "limit";

end;$$;

ALTER FUNCTION "public"."all_podcasts"("limit" integer, "isPrivate" boolean, "isPublished" boolean) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."assign_podcast_owner"("id" integer, "owner" "text", "activation_code" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
#variable_conflict use_variable
begin
    -- Check if access code matches the uuid of the podcast
    IF EXISTS (SELECT 1 FROM "Podcasts" WHERE "Podcasts".id = "id" AND REPLACE("Podcasts".uuid::text, '-', '') = "activation_code") THEN
        -- Update the owner of the podcast if the access code matches
        UPDATE "Podcasts"
        SET owner = owner
        WHERE "Podcasts".id = id;
    ELSE
        -- Raise an error if the access code does not match
        RAISE EXCEPTION 'Access denied: Invalid access code for podcast ID %', podcast_id;
    END IF;
END;
$$;

ALTER FUNCTION "public"."assign_podcast_owner"("id" integer, "owner" "text", "activation_code" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."chunk_vector_search"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer) RETURNS TABLE("id" bigint, "document" bigint, "meta" "jsonb", "content" "text", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
#variable_conflict use_variable
begin
  return query
  select
    c.id,
    c.document,
    c.meta,
    c.content,
    (c.embedding <#> embedding) * -1 as similarity
  from "Chunks" c

  JOIN "Documents" d ON d.id = c.document
  JOIN "Episodes" e on e.id = d.episode
  JOIN "Podcasts" p ON p.id = e.podcast

  -- We only care about sections that have a useful amount of content
  where length(c.content) >= min_content_length

  -- The dot product is negative because of a Postgres limitation, so we negate it
  and (c.embedding <#> embedding) * -1 > match_threshold

  -- Only discoverable podcasts.
  AND (p.private = FALSE AND p.published = TRUE)

  -- OpenAI embeddings are normalized to length 1, so
  -- cosine similarity and dot product will produce the same results.
  -- Using dot product which can be computed slightly faster.
  --
  -- For the different syntaxes, see https://github.com/pgvector/pgvector
  order by c.embedding <#> embedding

  limit match_count;
end;
$$;

ALTER FUNCTION "public"."chunk_vector_search"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."chunk_vector_search_episode"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "episode_id" bigint) RETURNS TABLE("id" bigint, "document" bigint, "meta" "jsonb", "content" "text", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
#variable_conflict use_variable
begin
  return query
  select
    c.id,
    c.document,
    c.meta,
    c.content,
    (c.embedding <#> embedding) * -1 as similarity
  from "Chunks" c

  -- Limit to episode_id.
  JOIN "Documents" d ON d.id = c.document
  JOIN "Episodes" e on e.id = d.episode AND e.id = episode_id

  -- We only care about sections that have a useful amount of content
  where length(c.content) >= min_content_length

  -- The dot product is negative because of a Postgres limitation, so we negate it
  and (c.embedding <#> embedding) * -1 > match_threshold

  -- OpenAI embeddings are normalized to length 1, so
  -- cosine similarity and dot product will produce the same results.
  -- Using dot product which can be computed slightly faster.
  --
  -- For the different syntaxes, see https://github.com/pgvector/pgvector
  order by c.embedding <#> embedding

  limit match_count;
end;
$$;

ALTER FUNCTION "public"."chunk_vector_search_episode"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "episode_id" bigint) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."chunk_vector_search_podcast"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "podcast_id" bigint) RETURNS TABLE("id" bigint, "document" bigint, "meta" "jsonb", "content" "text", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
#variable_conflict use_variable
begin
  return query
  select
    c.id,
    c.document,
    c.meta,
    c.content,
    (c.embedding <#> embedding) * -1 as similarity
  from "Chunks" c

  -- Limit to podcast_id.
  JOIN "Documents" d ON d.id = c.document
  JOIN "Episodes" e on e.id = d.episode
  JOIN "Podcasts" p ON p.id = e.podcast AND p.id = podcast_id

  -- We only care about sections that have a useful amount of content
  where length(c.content) >= min_content_length

  -- The dot product is negative because of a Postgres limitation, so we negate it
  and (c.embedding <#> embedding) * -1 > match_threshold

  -- OpenAI embeddings are normalized to length 1, so
  -- cosine similarity and dot product will produce the same results.
  -- Using dot product which can be computed slightly faster.
  --
  -- For the different syntaxes, see https://github.com/pgvector/pgvector
  order by c.embedding <#> embedding

  limit match_count;
end;
$$;

ALTER FUNCTION "public"."chunk_vector_search_podcast"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "podcast_id" bigint) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."episode_search"("query" "text", "podcast_slug" "text", "match_count" integer) RETURNS TABLE("id" bigint, "title" "text", "description" "text", "slug" "text", "podcast" bigint, "imageUrl" "text")
    LANGUAGE "plpgsql"
    AS $$

#variable_conflict use_variable

begin
  return query
  select q.id, q.title, q.description, q.slug, q.podcast, q."imageUrl" FROM (
  select
    e.id as id,
    e.title as title,
    e.description as description,
    e.slug as slug,
    e.podcast as podcast,
    e."imageUrl" as "imageUrl",
    p.id as podcast_id,
    p.private,
    p.published
  from "Episodes" e
  JOIN (select * from "Podcasts") p ON p.id = e.podcast
WHERE (episode_state(e.status) = 'ready')
      AND ((e.title &@~ query) OR (e.description &@~ query))
      AND (podcast_slug IS NULL OR p.slug = podcast_slug)
  order by e."pubDate" DESC
  limit match_count
  ) q;

end;
$$;

ALTER FUNCTION "public"."episode_search"("query" "text", "podcast_slug" "text", "match_count" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."episode_state"("status" "jsonb") RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
    started_at TIMESTAMP;
    completed_at TIMESTAMP;
    message TEXT;
BEGIN
    -- Extract the status fields if they exist
    started_at := (status ->> 'startedAt')::TIMESTAMP;
    completed_at := (status ->> 'completedAt')::TIMESTAMP;
    message := status ->> 'message';

    IF started_at IS NULL THEN
        RETURN 'pending';
    ELSIF started_at IS NOT NULL AND completed_at IS NOT NULL AND message IS NOT NULL AND message LIKE 'Error%' THEN
        RETURN 'error';
    ELSIF started_at IS NOT NULL AND completed_at IS NULL THEN
        RETURN 'processing';
    ELSE
        RETURN 'ready';
    END IF;
END;
$$;

ALTER FUNCTION "public"."episode_state"("status" "jsonb") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_page_parents"("page_id" bigint) RETURNS TABLE("id" bigint, "parent_page_id" bigint, "path" "text", "meta" "jsonb")
    LANGUAGE "sql"
    AS $$
  with recursive chain as (
    select *
    from nods_page
    where id = page_id

    union all

    select child.*
      from nods_page as child
      join chain on chain.parent_page_id = child.id
  )
  select id, parent_page_id, path, meta
  from chain;
$$;

ALTER FUNCTION "public"."get_page_parents"("page_id" bigint) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."is_podcast_owner"("episodeid" bigint, "userid" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
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

ALTER FUNCTION "public"."is_podcast_owner"("episodeid" bigint, "userid" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."is_podcast_owner_with_podcast_id"("podcastId" bigint, "userid" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
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

ALTER FUNCTION "public"."is_podcast_owner_with_podcast_id"("podcastId" bigint, "userid" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."latest_episodes"("limit" integer) RETURNS TABLE("id" bigint, "title" "text", "description" "text", "slug" "text", "imageUrl" "text", "pubDate" timestamp with time zone, "podcastSlug" "text", "podcastTitle" "text", "podcastImageUrl" "text")
    LANGUAGE "plpgsql"
    AS $$#variable_conflict use_variable
begin
  return query

select * from (
select distinct
  on ("Episodes".podcast)
  "Episodes".id as id,
  "Episodes".title as title,
  "Episodes".description as description,
  "Episodes".slug as slug,
  "Episodes"."imageUrl" as "imageUrl",
  "Episodes"."pubDate" as "pubDate",
  "Podcasts"."slug" as "podcastSlug",
  "Podcasts"."title" as "podcastTitle",
  "Podcasts"."imageUrl" AS "podcastImageUrl"
from
  "Episodes"
INNER JOIN "Podcasts" ON "Podcasts".id = "Episodes".podcast
where
"Episodes"."status" IS NOT NULL
AND ("Podcasts".private = false)
AND ("Podcasts".published = true)
AND ("Episodes"."status" ->> 'startedAt') <> 'null'
AND ("Episodes"."status" ->> 'completedAt') <> 'null'
AND "Episodes"."status" ->> 'message' NOT LIKE 'Error%'
  ORDER BY "Episodes".podcast, "Episodes"."pubDate" DESC
) as e
ORDER BY "pubDate" DESC
LIMIT "limit";

end;$$;

ALTER FUNCTION "public"."latest_episodes"("limit" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."podcast_search"("query" "text", "match_count" integer) RETURNS TABLE("id" bigint, "title" "text", "description" "text", "slug" "text", "imageUrl" "text")
    LANGUAGE "plpgsql"
    AS $$#variable_conflict use_variable
begin
  return query
  select
    "Podcasts".id,
    "Podcasts".title,
    "Podcasts".description,
    "Podcasts".slug,
    "Podcasts"."imageUrl"
  from "Podcasts"

  -- We only care about sections that have a useful amount of content
  where ("Podcasts".private = FALSE AND "Podcasts".published = TRUE) AND (("Podcasts".title &@~ query) OR ("Podcasts".description &@~ query))

  limit match_count;
end;$$;

ALTER FUNCTION "public"."podcast_search"("query" "text", "match_count" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."podcast_stats"() RETURNS TABLE("id" bigint, "title" "text", "description" "text", "slug" "text", "imageUrl" "text", "owner" "text", "newest" timestamp with time zone, "newestprocessed" timestamp with time zone, "allepisodes" bigint, "processed" bigint, "inprogress" bigint, "errors" bigint, "process" boolean, "private" boolean, "uuid" "text")
    LANGUAGE "plpgsql"
    AS $$
#variable_conflict use_variable
begin
  return query

select
  p.id,
  p.title,
  p.description,
  p.slug,
  p."imageUrl",
  p.owner,
  allepisodes.newest as newest,
  processed.newest as newestprocessed,
  coalesce(allepisodes.count, 0) as allepisodes,
  coalesce(processed.count, 0) as processed,
  coalesce(inprogress.count, 0) as inprogress,
  coalesce(errors.count, 0) as errors,
  p.process,
  p.private,
  p.uuid::text as uuid
from
  "Podcasts" p

JOIN (
  select podcast, MAX("pubDate") as newest, COUNT(*) as count FROM "Episodes"
  group by podcast
) allepisodes
ON p.id = allepisodes.podcast

LEFT OUTER JOIN (
  select podcast, MAX("pubDate") as newest, COUNT(*) as count FROM "Episodes"
  where status IS NOT NULL
    AND status -> 'startedAt' IS NOT null
    AND status -> 'completedAt' IS NOT null
    AND status ->> 'message' NOT LIKE 'Error%'
  group by podcast
) processed
ON p.id = processed.podcast

left outer join (
  select podcast, COUNT(*) as count FROM "Episodes"
  where status IS NOT NULL
    AND status -> 'startedAt' IS NOT null
    AND status -> 'completedAt' IS null
  group by podcast
) inprogress
on p.id = inprogress.podcast
left outer join (
  select podcast, COUNT(*) as count FROM "Episodes"
  where status IS NOT NULL
    AND status -> 'startedAt' IS NOT null
    AND status -> 'completedAt' IS NOT null
    AND status ->> 'message' LIKE 'Error%'
    group by podcast
) errors
on p.id = errors.podcast;

end;
$$;

ALTER FUNCTION "public"."podcast_stats"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."requesting_user_id"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$-- https://clerk.com/docs/integrations/databases/supabase

  select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$$;

ALTER FUNCTION "public"."requesting_user_id"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."Chunks" (
    "id" bigint NOT NULL,
    "document" bigint NOT NULL,
    "content" "text",
    "embedding" "public"."vector"(1536),
    "meta" "jsonb"
);
ALTER TABLE ONLY "public"."Chunks" ALTER COLUMN "embedding" SET STORAGE EXTENDED;

ALTER TABLE "public"."Chunks" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."Documents" (
    "id" bigint NOT NULL,
    "checksum" "text",
    "meta" "jsonb",
    "episode" bigint,
    "source" "text",
    "created_at" timestamp with time zone
);

ALTER TABLE "public"."Documents" OWNER TO "postgres";

ALTER TABLE "public"."Documents" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Documents_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."Episodes" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "podcast" bigint NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "url" "text",
    "imageUrl" "text",
    "audioUrl" "text",
    "transcriptUrl" "text",
    "summaryUrl" "text",
    "pubDate" timestamp with time zone,
    "guid" "text",
    "error" "jsonb",
    "rawTranscriptUrl" "text",
    "modified_at" timestamp with time zone DEFAULT "now"(),
    "status" "jsonb",
    "originalAudioUrl" "text",
    "published" boolean DEFAULT false,
    "duration" bigint
);

ALTER TABLE "public"."Episodes" OWNER TO "postgres";

ALTER TABLE "public"."Episodes" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Episodes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE OR REPLACE VIEW "public"."Episodes_with_state" WITH ("security_invoker"='on') AS
 SELECT "Episodes"."id",
    "Episodes"."created_at",
    "Episodes"."podcast",
    "Episodes"."slug",
    "Episodes"."title",
    "Episodes"."description",
    "Episodes"."url",
    "Episodes"."imageUrl",
    "Episodes"."audioUrl",
    "Episodes"."transcriptUrl",
    "Episodes"."summaryUrl",
    "Episodes"."pubDate",
    "Episodes"."guid",
    "Episodes"."error",
    "Episodes"."rawTranscriptUrl",
    "Episodes"."modified_at",
    "Episodes"."status",
    "Episodes"."originalAudioUrl",
    "Episodes"."published",
    "Episodes"."duration",
    "public"."episode_state"("Episodes"."status") AS "state"
   FROM "public"."Episodes";

ALTER TABLE "public"."Episodes_with_state" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."Invitations" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "modified_at" timestamp with time zone DEFAULT "now"(),
    "podcast" bigint NOT NULL,
    "name" "text",
    "email" "text" NOT NULL,
    "status" "text"
);

ALTER TABLE "public"."Invitations" OWNER TO "postgres";

ALTER TABLE "public"."Invitations" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Invitations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."Podcasts" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "url" "text",
    "rssUrl" "text",
    "imageUrl" "text",
    "owner" "text" DEFAULT "public"."requesting_user_id"(),
    "copyright" "text",
    "author" "text",
    "private" boolean DEFAULT true,
    "uuid" "uuid" DEFAULT "gen_random_uuid"(),
    "published" boolean DEFAULT false,
    "process" boolean DEFAULT false NOT NULL
);

ALTER TABLE "public"."Podcasts" OWNER TO "postgres";

ALTER TABLE "public"."Podcasts" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Podcasts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."SpeakerMap" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "speakerId" "text" NOT NULL,
    "name" "text",
    "episode" bigint NOT NULL,
    "modified_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."SpeakerMap" OWNER TO "postgres";

ALTER TABLE "public"."SpeakerMap" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."SpeakerMap_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."Subscriptions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user" "text" NOT NULL,
    "description" "text",
    "state" "text" NOT NULL,
    "plan" "text" NOT NULL,
    "billingProviderId" "text",
    "modified_at" timestamp with time zone DEFAULT "now"(),
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone
);

ALTER TABLE "public"."Subscriptions" OWNER TO "postgres";

ALTER TABLE "public"."Subscriptions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Subscriptions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."Suggestions" (
    "id" bigint NOT NULL,
    "episode" bigint,
    "suggestion" "text",
    "podcast" bigint
);

ALTER TABLE "public"."Suggestions" OWNER TO "postgres";

ALTER TABLE "public"."Suggestions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Suggestions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."Users" (
    "id" "text" DEFAULT "public"."requesting_user_id"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "displayName" "text"
);

ALTER TABLE "public"."Users" OWNER TO "postgres";

CREATE SEQUENCE IF NOT EXISTS "public"."nods_page_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE "public"."nods_page_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."nods_page_id_seq" OWNED BY "public"."Documents"."id";

CREATE SEQUENCE IF NOT EXISTS "public"."nods_page_section_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE "public"."nods_page_section_id_seq" OWNER TO "postgres";

ALTER SEQUENCE "public"."nods_page_section_id_seq" OWNED BY "public"."Chunks"."id";

ALTER TABLE "public"."Chunks" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."nods_page_section_id_seq1"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE ONLY "public"."Episodes"
    ADD CONSTRAINT "Episodes_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."Episodes"
    ADD CONSTRAINT "Episodes_unique_guid" UNIQUE ("guid");

ALTER TABLE ONLY "public"."Episodes"
    ADD CONSTRAINT "Episodes_unique_id_and_guid" UNIQUE ("id", "guid");

ALTER TABLE ONLY "public"."Invitations"
    ADD CONSTRAINT "Invitations_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."Podcasts"
    ADD CONSTRAINT "Podcasts_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."Podcasts"
    ADD CONSTRAINT "Podcasts_unique_id_and_slug" UNIQUE ("id", "slug");

ALTER TABLE ONLY "public"."SpeakerMap"
    ADD CONSTRAINT "SpeakerMap_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."Subscriptions"
    ADD CONSTRAINT "Subscriptions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."Suggestions"
    ADD CONSTRAINT "Suggestions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."Documents"
    ADD CONSTRAINT "nods_page_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."Chunks"
    ADD CONSTRAINT "nods_page_section_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."Documents"
    ADD CONSTRAINT "uniquedocumentsourceurl" UNIQUE ("episode", "source");

ALTER TABLE ONLY "public"."SpeakerMap"
    ADD CONSTRAINT "uniquespeakermapping" UNIQUE ("speakerId", "episode");

CREATE INDEX "Chunks_document_idx" ON "public"."Chunks" USING "hash" ("document");

CREATE INDEX "Documents_episode_idx" ON "public"."Documents" USING "hash" ("episode");

CREATE INDEX "Podcasts_owner_idx" ON "public"."Podcasts" USING "hash" ("owner");

CREATE INDEX "SpeakerMap_episode_idx" ON "public"."SpeakerMap" USING "hash" ("episode");

CREATE INDEX "Suggestions_episode_idx" ON "public"."Suggestions" USING "hash" ("episode");

ALTER TABLE ONLY "public"."Episodes"
    ADD CONSTRAINT "Episodes_podcast_fkey" FOREIGN KEY ("podcast") REFERENCES "public"."Podcasts"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."Invitations"
    ADD CONSTRAINT "Invitations_podcast_fkey" FOREIGN KEY ("podcast") REFERENCES "public"."Podcasts"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."SpeakerMap"
    ADD CONSTRAINT "SpeakerMap_episode_fkey" FOREIGN KEY ("episode") REFERENCES "public"."Episodes"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."Suggestions"
    ADD CONSTRAINT "Suggestions_podcast_fkey" FOREIGN KEY ("podcast") REFERENCES "public"."Podcasts"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."Chunks"
    ADD CONSTRAINT "public_Chunks_document_fkey" FOREIGN KEY ("document") REFERENCES "public"."Documents"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."Documents"
    ADD CONSTRAINT "public_Documents_episode_fkey" FOREIGN KEY ("episode") REFERENCES "public"."Episodes"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."Podcasts"
    ADD CONSTRAINT "public_Podcasts_owner_fkey" FOREIGN KEY ("owner") REFERENCES "public"."Users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."Subscriptions"
    ADD CONSTRAINT "public_Subscriptions_user_fkey" FOREIGN KEY ("user") REFERENCES "public"."Users"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."Suggestions"
    ADD CONSTRAINT "public_Suggestions_episode_fkey" FOREIGN KEY ("episode") REFERENCES "public"."Episodes"("id") ON UPDATE CASCADE ON DELETE CASCADE;

CREATE POLICY "Allow access by owner" ON "public"."Subscriptions" USING (("public"."requesting_user_id"() = "user"));

CREATE POLICY "Allow delete by Podcast owner" ON "public"."Chunks" FOR DELETE USING ("public"."is_podcast_owner"(( SELECT "d"."episode"
   FROM "public"."Documents" "d"
  WHERE ("d"."id" = "Chunks"."document")), "public"."requesting_user_id"()));

CREATE POLICY "Allow delete by Podcast owner" ON "public"."Documents" FOR DELETE USING ("public"."is_podcast_owner"("episode", "public"."requesting_user_id"()));

CREATE POLICY "Allow delete by Podcast owner" ON "public"."Episodes" FOR DELETE USING ("public"."is_podcast_owner_with_podcast_id"("podcast", "public"."requesting_user_id"()));

CREATE POLICY "Allow delete by Podcast owner" ON "public"."Podcasts" USING (("public"."requesting_user_id"() = "owner"));

CREATE POLICY "Allow delete by Podcast owner" ON "public"."SpeakerMap" FOR DELETE USING ("public"."is_podcast_owner"("episode", "public"."requesting_user_id"()));

CREATE POLICY "Allow delete by Podcast owner" ON "public"."Suggestions" FOR DELETE USING ("public"."is_podcast_owner"("episode", "public"."requesting_user_id"()));

CREATE POLICY "Allow insert by Podcast owner" ON "public"."Chunks" FOR INSERT WITH CHECK ("public"."is_podcast_owner"(( SELECT "d"."episode"
   FROM "public"."Documents" "d"
  WHERE ("d"."id" = "Chunks"."document")), "public"."requesting_user_id"()));

CREATE POLICY "Allow insert by Podcast owner" ON "public"."Documents" FOR INSERT WITH CHECK ("public"."is_podcast_owner"("episode", "public"."requesting_user_id"()));

CREATE POLICY "Allow insert by Podcast owner" ON "public"."Episodes" FOR INSERT WITH CHECK ("public"."is_podcast_owner_with_podcast_id"("podcast", "public"."requesting_user_id"()));

CREATE POLICY "Allow insert by Podcast owner" ON "public"."SpeakerMap" FOR INSERT WITH CHECK ("public"."is_podcast_owner"("episode", "public"."requesting_user_id"()));

CREATE POLICY "Allow insert by Podcast owner" ON "public"."Suggestions" FOR INSERT WITH CHECK ("public"."is_podcast_owner"("episode", "public"."requesting_user_id"()));

CREATE POLICY "Allow insert by any authed user" ON "public"."Podcasts" WITH CHECK (("public"."requesting_user_id"() <> ''::"text"));

CREATE POLICY "Allow insert by any authed user" ON "public"."Subscriptions" WITH CHECK (("public"."requesting_user_id"() <> ''::"text"));

CREATE POLICY "Allow insert on Users when requesting_user_id() is not empty" ON "public"."Users" FOR INSERT WITH CHECK (("public"."requesting_user_id"() <> ''::"text"));

CREATE POLICY "Allow read access for all users" ON "public"."Chunks" FOR SELECT USING (true);

CREATE POLICY "Allow read access for all users" ON "public"."Documents" FOR SELECT USING (true);

CREATE POLICY "Allow read access for all users" ON "public"."Episodes" FOR SELECT USING (true);

CREATE POLICY "Allow read access for all users" ON "public"."Podcasts" FOR SELECT USING (true);

CREATE POLICY "Allow read access for all users" ON "public"."SpeakerMap" FOR SELECT USING (true);

CREATE POLICY "Allow read access for all users" ON "public"."Suggestions" FOR SELECT USING (true);

CREATE POLICY "Allow update by Podcast owner" ON "public"."Documents" FOR UPDATE USING ("public"."is_podcast_owner"("episode", "public"."requesting_user_id"()));

CREATE POLICY "Allow update by Podcast owner" ON "public"."Episodes" FOR UPDATE USING ("public"."is_podcast_owner_with_podcast_id"("podcast", "public"."requesting_user_id"()));

CREATE POLICY "Allow update by Podcast owner" ON "public"."Podcasts" USING (("public"."requesting_user_id"() = "owner"));

CREATE POLICY "Allow update by Podcast owner" ON "public"."SpeakerMap" FOR UPDATE USING ("public"."is_podcast_owner"("episode", "public"."requesting_user_id"()));

CREATE POLICY "Allow update by Podcast owner" ON "public"."Suggestions" FOR UPDATE USING ("public"."is_podcast_owner"("episode", "public"."requesting_user_id"()));

CREATE POLICY "Allow user update if id matches requesting_user_id()" ON "public"."Users" FOR UPDATE USING (("id" = "public"."requesting_user_id"()));

ALTER TABLE "public"."Chunks" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."Documents" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for authenticated users only" ON "public"."Invitations" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON "public"."Invitations" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."Users" FOR SELECT USING (true);

ALTER TABLE "public"."Episodes" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."Invitations" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."Podcasts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."SpeakerMap" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."Subscriptions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."Suggestions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."Users" ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."all_podcasts"("limit" integer, "isPrivate" boolean, "isPublished" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."all_podcasts"("limit" integer, "isPrivate" boolean, "isPublished" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."all_podcasts"("limit" integer, "isPrivate" boolean, "isPublished" boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."assign_podcast_owner"("id" integer, "owner" "text", "activation_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."assign_podcast_owner"("id" integer, "owner" "text", "activation_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_podcast_owner"("id" integer, "owner" "text", "activation_code" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."chunk_vector_search"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."chunk_vector_search"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."chunk_vector_search"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."chunk_vector_search_episode"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "episode_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."chunk_vector_search_episode"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "episode_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."chunk_vector_search_episode"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "episode_id" bigint) TO "service_role";

GRANT ALL ON FUNCTION "public"."chunk_vector_search_podcast"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "podcast_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."chunk_vector_search_podcast"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "podcast_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."chunk_vector_search_podcast"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "podcast_id" bigint) TO "service_role";

GRANT ALL ON FUNCTION "public"."episode_search"("query" "text", "podcast_slug" "text", "match_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."episode_search"("query" "text", "podcast_slug" "text", "match_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."episode_search"("query" "text", "podcast_slug" "text", "match_count" integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."episode_state"("status" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."episode_state"("status" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."episode_state"("status" "jsonb") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_page_parents"("page_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_page_parents"("page_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_page_parents"("page_id" bigint) TO "service_role";

GRANT ALL ON FUNCTION "public"."is_podcast_owner"("episodeid" bigint, "userid" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_podcast_owner"("episodeid" bigint, "userid" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_podcast_owner"("episodeid" bigint, "userid" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."is_podcast_owner_with_podcast_id"("podcastId" bigint, "userid" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_podcast_owner_with_podcast_id"("podcastId" bigint, "userid" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_podcast_owner_with_podcast_id"("podcastId" bigint, "userid" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."latest_episodes"("limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."latest_episodes"("limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."latest_episodes"("limit" integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."podcast_search"("query" "text", "match_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."podcast_search"("query" "text", "match_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."podcast_search"("query" "text", "match_count" integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."podcast_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."podcast_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."podcast_stats"() TO "service_role";

GRANT ALL ON FUNCTION "public"."requesting_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."requesting_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."requesting_user_id"() TO "service_role";

GRANT ALL ON TABLE "public"."Chunks" TO "anon";
GRANT ALL ON TABLE "public"."Chunks" TO "authenticated";
GRANT ALL ON TABLE "public"."Chunks" TO "service_role";

GRANT ALL ON TABLE "public"."Documents" TO "anon";
GRANT ALL ON TABLE "public"."Documents" TO "authenticated";
GRANT ALL ON TABLE "public"."Documents" TO "service_role";

GRANT ALL ON SEQUENCE "public"."Documents_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Documents_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Documents_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."Episodes" TO "anon";
GRANT ALL ON TABLE "public"."Episodes" TO "authenticated";
GRANT ALL ON TABLE "public"."Episodes" TO "service_role";

GRANT ALL ON SEQUENCE "public"."Episodes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Episodes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Episodes_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."Episodes_with_state" TO "anon";
GRANT ALL ON TABLE "public"."Episodes_with_state" TO "authenticated";
GRANT ALL ON TABLE "public"."Episodes_with_state" TO "service_role";

GRANT ALL ON TABLE "public"."Invitations" TO "anon";
GRANT ALL ON TABLE "public"."Invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."Invitations" TO "service_role";

GRANT ALL ON SEQUENCE "public"."Invitations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Invitations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Invitations_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."Podcasts" TO "anon";
GRANT ALL ON TABLE "public"."Podcasts" TO "authenticated";
GRANT ALL ON TABLE "public"."Podcasts" TO "service_role";

GRANT ALL ON SEQUENCE "public"."Podcasts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Podcasts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Podcasts_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."SpeakerMap" TO "anon";
GRANT ALL ON TABLE "public"."SpeakerMap" TO "authenticated";
GRANT ALL ON TABLE "public"."SpeakerMap" TO "service_role";

GRANT ALL ON SEQUENCE "public"."SpeakerMap_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."SpeakerMap_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."SpeakerMap_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."Subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."Subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."Subscriptions" TO "service_role";

GRANT ALL ON SEQUENCE "public"."Subscriptions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Subscriptions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Subscriptions_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."Suggestions" TO "anon";
GRANT ALL ON TABLE "public"."Suggestions" TO "authenticated";
GRANT ALL ON TABLE "public"."Suggestions" TO "service_role";

GRANT ALL ON SEQUENCE "public"."Suggestions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Suggestions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Suggestions_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."Users" TO "anon";
GRANT ALL ON TABLE "public"."Users" TO "authenticated";
GRANT ALL ON TABLE "public"."Users" TO "service_role";

GRANT ALL ON SEQUENCE "public"."nods_page_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."nods_page_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."nods_page_id_seq" TO "service_role";

GRANT ALL ON SEQUENCE "public"."nods_page_section_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."nods_page_section_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."nods_page_section_id_seq" TO "service_role";

GRANT ALL ON SEQUENCE "public"."nods_page_section_id_seq1" TO "anon";
GRANT ALL ON SEQUENCE "public"."nods_page_section_id_seq1" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."nods_page_section_id_seq1" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";

RESET ALL;
