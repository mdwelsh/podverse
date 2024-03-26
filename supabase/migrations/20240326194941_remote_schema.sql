
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

create extension IF NOT EXISTS vector with schema "public";

CREATE OR REPLACE FUNCTION "public"."chunk_vector_search"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer) RETURNS TABLE("id" bigint, "document" bigint, "meta" "jsonb", "content" "text", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
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
    "author" "text",
    "copyright" "text"
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

CREATE TABLE IF NOT EXISTS "public"."Suggestions" (
    "id" bigint NOT NULL,
    "episode" bigint NOT NULL,
    "suggestion" "text"
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
    "displayName" "text",
    "plan" "text"
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

ALTER TABLE ONLY "public"."Podcasts"
    ADD CONSTRAINT "Podcasts_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."Podcasts"
    ADD CONSTRAINT "Podcasts_unique_id_and_slug" UNIQUE ("id", "slug");

ALTER TABLE ONLY "public"."SpeakerMap"
    ADD CONSTRAINT "SpeakerMap_pkey" PRIMARY KEY ("id");

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

ALTER TABLE ONLY "public"."Episodes"
    ADD CONSTRAINT "Episodes_podcast_fkey" FOREIGN KEY ("podcast") REFERENCES "public"."Podcasts"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."SpeakerMap"
    ADD CONSTRAINT "SpeakerMap_episode_fkey" FOREIGN KEY ("episode") REFERENCES "public"."Episodes"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."Chunks"
    ADD CONSTRAINT "public_Chunks_document_fkey" FOREIGN KEY ("document") REFERENCES "public"."Documents"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."Documents"
    ADD CONSTRAINT "public_Documents_episode_fkey" FOREIGN KEY ("episode") REFERENCES "public"."Episodes"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."Podcasts"
    ADD CONSTRAINT "public_Podcasts_owner_fkey" FOREIGN KEY ("owner") REFERENCES "public"."Users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."Suggestions"
    ADD CONSTRAINT "public_Suggestions_episode_fkey" FOREIGN KEY ("episode") REFERENCES "public"."Episodes"("id") ON UPDATE CASCADE ON DELETE CASCADE;

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

CREATE POLICY "Enable read access for all users" ON "public"."Users" FOR SELECT USING (true);

ALTER TABLE "public"."Episodes" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."Podcasts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."SpeakerMap" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."Suggestions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."Users" ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."chunk_vector_search"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."chunk_vector_search"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."chunk_vector_search"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."chunk_vector_search_episode"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "episode_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."chunk_vector_search_episode"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "episode_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."chunk_vector_search_episode"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "episode_id" bigint) TO "service_role";

GRANT ALL ON FUNCTION "public"."chunk_vector_search_podcast"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "podcast_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."chunk_vector_search_podcast"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "podcast_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."chunk_vector_search_podcast"("embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "min_content_length" integer, "podcast_id" bigint) TO "service_role";

GRANT ALL ON FUNCTION "public"."get_page_parents"("page_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_page_parents"("page_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_page_parents"("page_id" bigint) TO "service_role";

GRANT ALL ON FUNCTION "public"."is_podcast_owner"("episodeid" bigint, "userid" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_podcast_owner"("episodeid" bigint, "userid" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_podcast_owner"("episodeid" bigint, "userid" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."is_podcast_owner_with_podcast_id"("podcastId" bigint, "userid" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_podcast_owner_with_podcast_id"("podcastId" bigint, "userid" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_podcast_owner_with_podcast_id"("podcastId" bigint, "userid" "text") TO "service_role";

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
