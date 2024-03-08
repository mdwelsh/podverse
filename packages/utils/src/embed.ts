import { OpenAI } from 'openai';
import { SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { TextSplitter, TextSplit } from './splitters.js';

/** Given a URL pointing to a plain text file, embed it for vector search. Return the Document ID. */
export async function EmbedText(supabase: SupabaseClient, url: string, episodeId?: number, meta?: object): Promise<number> {
  console.log(`Embedding text from ${url}`);
  const res = await fetch(url);
  const text = await res.text();
  const checksum = createHash('sha256').update(text).digest('base64');
  const splitter = new TextSplitter({ splitLongSentences: true });
  const chunks = splitter.splitText(text);
  return await EmbedChunks(supabase, chunks, url, checksum, episodeId, meta);
}

/** Given a URL pointing to a transcript JSON file, embed it for vector search. Return the Document ID. */
export async function EmbedTranscript(supabase: SupabaseClient, url: string, episodeId?: number, meta?: object): Promise<number> {
  console.log(`Embedding transcript from ${url} for episode ${episodeId}`);
  const res = await fetch(url);
  const text = await res.text();
  const transcript = JSON.parse(text);
  const checksum = createHash('sha256').update(text).digest('base64');
  const splitter = new TextSplitter({ splitLongSentences: true });
  const chunks = splitter.splitTranscript(transcript);
  return await EmbedChunks(supabase, chunks, url, checksum, episodeId, meta);
}

/** Given a set of chunks, store embeddings for them. */
async function EmbedChunks(
  supabase: SupabaseClient,
  chunks: TextSplit[],
  sourceUrl: string,
  checksum: string,
  episodeId?: number,
  meta?: object,
): Promise<number> {
  // Generate embedding for each chunk.
  console.log(`Embedding ${chunks.length} chunks for episode ${episodeId} from ${sourceUrl} with checksum ${checksum}`);

  const embeddings = await Promise.all(chunks.map((chunk) => CreateEmbedding(chunk.text)));

  // XXX MDW DEBUGGING
  const { data, error: e } = await supabase.from('Episodes').select('*, podcast(*)').eq('id', episodeId).limit(1);
  if (e) {
    console.error('error trying to look up episode', e);
  }
  if (data && data.length > 0) {
    console.log('found episode:', data[0]);
  }

  // Create Document entry.
  const { data: document, error } = await supabase
    .from('Documents')
    .upsert(
      {
        checksum,
        episode: episodeId,
        source: sourceUrl,
        meta,
      },
      { onConflict: 'episode,source' },
    )
    .select()
    .limit(1)
    .single();
  if (error) {
    console.error('error inserting Embed page entry', error);
    throw error;
  }

  // For each chunk, we create a "page section" entry, with the page created above
  // as a parent. Each section contains the content of the chunk and its vector embedding.
  for (let i = 0; i < chunks.length; i++) {
    const embedding = embeddings[i];
    const { error } = await supabase
      .from('Chunks')
      .insert({
        document: document.id,
        content: chunks[i].text,
        embedding,
        meta: chunks[i].meta,
      })
      .select()
      .limit(1)
      .single();
    if (error) {
      console.error('error inserting Chunk entry', error);
      throw error;
    }
  }
  console.log(`Embedded ${chunks.length} chunks for document ID ${document.id}`);
  return document.id;
}

/** Given the provided text, return an embedding vector. */
async function CreateEmbedding(input: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY environment variable.');
  }
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input,
  });
  const embedding = embeddingResponse.data[0].embedding;
  return embedding;
}

/** Represents a vector search result. */
export interface VectorSearchResult {
  chunkId: number;
  documentId: number;
  similarity: number;
  content: string;
  meta?: object;
}

/** Given the provided text, perform a vector search. */
export async function VectorSearch(supabase: SupabaseClient, input: string): Promise<VectorSearchResult[]> {
  console.log(`VectorSearch with input: ${input}`);
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY environment variable.');
  }
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: input.trim().replace(/\s+/g, ' '),
  });
  const queryEmbedding = embeddingResponse.data[0].embedding;

  // The chunk_vector_search function is a Postgres stored procedure that performs the
  // vector search:
  //
  // #variable_conflict use_variable
  // begin
  //   return query
  //   select
  //     nods_page_section.id,
  //     nods_page_section.page_id,
  //     nods_page_section.slug,
  //     nods_page_section.heading,
  //     nods_page_section.content,
  //     (nods_page_section.embedding <#> embedding) * -1 as similarity
  //   from nods_page_section

  //   -- We only care about sections that have a useful amount of content
  //   where length(nods_page_section.content) >= min_content_length

  //   -- The dot product is negative because of a Postgres limitation, so we negate it
  //   and (nods_page_section.embedding <#> embedding) * -1 > match_threshold

  //   -- OpenAI embeddings are normalized to length 1, so
  //   -- cosine similarity and dot product will produce the same results.
  //   -- Using dot product which can be computed slightly faster.
  //   --
  //   -- For the different syntaxes, see https://github.com/pgvector/pgvector
  //   order by nods_page_section.embedding <#> embedding

  //   limit match_count;
  // end;

  console.log(`Calling chunk_vector_search with queryEmbedding: ${queryEmbedding}`);

  const { data, error } = await supabase.rpc('chunk_vector_search', {
    embedding: queryEmbedding,
    match_threshold: 0.8,
    match_count: 10,
    min_content_length: 50,
  });
  if (error) {
    console.error('Error with RPC chunk_vector_search: ', error);
    throw error;
  }
  return data.map((row: { id: number; document: number; similarity: number; content: string; meta: object }) => {
    return {
      chunkId: row.id,
      documentId: row.document,
      similarity: row.similarity,
      content: row.content,
      meta: row.meta,
    };
  });
}
