-- This migration adds podcast- and episode-specific versions of the
-- chunk_vector_search function.

DROP FUNCTION IF EXISTS chunk_vector_search_podcast;

CREATE OR REPLACE FUNCTION chunk_vector_search_podcast(embedding vector(1536), match_threshold float, match_count int, min_content_length int, podcast_id bigint)
RETURNS TABLE (id bigint, document bigint, meta jsonb, content text, similarity float)
language plpgsql
as $$
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

DROP FUNCTION IF EXISTS chunk_vector_search_episode;

CREATE OR REPLACE FUNCTION chunk_vector_search_episode(embedding vector(1536), match_threshold float, match_count int, min_content_length int, episode_id bigint)
RETURNS TABLE (id bigint, document bigint, meta jsonb, content text, similarity float)
language plpgsql
as $$
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