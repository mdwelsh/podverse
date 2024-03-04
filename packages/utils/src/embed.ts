import { OpenAI } from 'openai';
import { Tiktoken, encodingForModel } from 'js-tiktoken';
import { SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

export const DEFAULT_CHUNK_SIZE = 1024;
export const DEFAULT_CHUNK_OVERLAP = 20;

/** Given the provided text, return an embedding vector. */
export async function CreateEmbedding(input: string): Promise<number[]> {
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

export type TextSplit = {
  // The contents of the text.
  text: string;
  // The number of tokens of the text, if it has been calculated.
  numTokens?: number;
  // The offset of this split into the source text.
  offset?: number;
};

/** Given the provided text, return a set of chunks. */
export function ChunkText(text: string): TextSplit[] {
  const splitter = new SentenceSplitter();
  return splitter.splitText(text);
}

/** Given a URL pointing to a plain text file, embed it for vector search. Return the Document ID. */
export async function EmbedText(supabase: SupabaseClient, url: string, meta: object): Promise<number> {
  console.log(`Embedding text from ${url}`);
  const res = await fetch(url);
  const text = await res.text();
  const checksum = createHash('sha256').update(text).digest('base64');
  const chunks = ChunkText(text);
  const embeddings = await Promise.all(chunks.map((chunk) => CreateEmbedding(chunk.text)));

  // Create Document entry.
  const { data: document, error } = await supabase
    .from('Documents')
    .upsert(
      {
        checksum,
        source: url,
        meta,
      },
      { onConflict: 'path' },
    )
    .select()
    .limit(1)
    .single();
  if (error) {
    console.log('error inserting Embed page entry', error);
    throw error;
  }

  // For each chunk, we create a "page section" entry, with the page created above
  // as a parent. Each section contains the content of the chunk and its vector embedding.
  for (let i = 0; i < chunks.length; i++) {
    const embedding = embeddings[i];

    const meta = {
      sourceOffset: chunks[i].offset,
    };

    const { error } = await supabase
      .from('Chunks')
      .insert({
        document: document.id,
        content: chunks[i].text,
        embedding,
        meta,
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

export interface VectorSearchResult {
  chunkId: number;
  documentId: number;
  similarity: number;
  content: string;
  meta?: object;
}

/** Given the provided text, perform a vector search. */
// XXX TODO(mdw): Type the response more accurately.
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

  const { data, error } = await supabase.rpc('chunk_vector_search', {
    embedding: queryEmbedding,
    match_threshold: 0.8,
    match_count: 10,
    min_content_length: 50,
  });
  if (error) {
    console.log('Error performing lookup', error);
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

// The following is adapted from:
// https://github.com/run-llama/LlamaIndexTS/blob/main/packages/core/src/TextSplitter.ts
// We don't import it directly because LlamaIndexTS has a bunch of dependencies (including things
// like ONNX Runtime) that we don't want to pull in.

// TODO(mdw): Adapt the following to be more "transcript-aware", i.e., splitting on speaker
// boundaries.

// Default splitter for sentences.
const defaultregex = /[.?!][\])'"`’”]*(?:\s|$)/g;
export const defaultSentenceTokenizer = (text: string): string[] => {
  const slist = [];
  const iter = text.matchAll(defaultregex);
  let lastIdx = 0;
  for (const match of iter) {
    slist.push(text.slice(lastIdx, match.index! + 1));
    lastIdx = match.index! + 1;
  }
  slist.push(text.slice(lastIdx));
  return slist.filter((s) => s.length > 0);
};

// Sentence splitter for CJK.
// Refs: https://github.com/fxsjy/jieba/issues/575#issuecomment-359637511
const resentencesp = /([﹒﹔﹖﹗．；。！？]["’”」』]{0,2}|：(?=["‘“「『]{1,2}|$))/;
export function cjkSentenceTokenizer(sentence: string): string[] {
  const slist = [];
  const parts = sentence.split(resentencesp);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (resentencesp.test(part) && slist.length > 0) {
      slist[slist.length - 1] += part;
    } else if (part) {
      slist.push(part);
    }
  }
  return slist.filter((s) => s.length > 0);
}

// In theory there's also Mac style \r only, but it's pre-OSX and I don't think
// many documents will use it.

/**
 * SentenceSplitter is our default text splitter that supports splitting into sentences, paragraphs, or fixed length chunks with overlap.
 *
 * One of the advantages of SentenceSplitter is that even in the fixed length chunks it will try to keep sentences together.
 */
export class SentenceSplitter {
  private chunkSize: number;
  private chunkOverlap: number;
  private paragraphSeparator: string;
  private chunkingTokenizerFn: (_text: string) => string[];
  private splitLongSentences: boolean;
  private encoding: Tiktoken;

  // MDW: The LlamaIndex code has some funky stuff to make the `encoding` object a singleton,
  // but we just create a new one for each instance of this class.

  private tokenizer(text: string): Uint32Array {
    return new Uint32Array(this.encoding.encode(text));
  }

  private tokenizerDecoder(tokens: Uint32Array): string {
    const numberArray = Array.from(tokens);
    const text = this.encoding.decode(numberArray);
    const uint8Array = new TextEncoder().encode(text);
    return new TextDecoder().decode(uint8Array);
  }

  constructor(options?: {
    chunkSize?: number;
    chunkOverlap?: number;
    paragraphSeparator?: string;
    chunkingTokenizerFn?: (_text: string) => string[];
    splitLongSentences?: boolean;
  }) {
    const {
      chunkSize = DEFAULT_CHUNK_SIZE,
      chunkOverlap = DEFAULT_CHUNK_OVERLAP,
      paragraphSeparator = '\n\n',
      chunkingTokenizerFn,
      splitLongSentences = false,
    } = options ?? {};

    if (chunkOverlap > chunkSize) {
      throw new Error(
        `Got a larger chunk overlap (${chunkOverlap}) than chunk size (${chunkSize}), should be smaller.`,
      );
    }
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;

    this.encoding = encodingForModel('text-embedding-ada-002'); // cl100k_base
    this.paragraphSeparator = paragraphSeparator;
    this.chunkingTokenizerFn = chunkingTokenizerFn ?? defaultSentenceTokenizer;
    this.splitLongSentences = splitLongSentences;
  }

  private getParagraphSplits(text: string, chunkSize: number): TextSplit[] {
    const paragraphSplits: string[] = text.split(this.paragraphSeparator);
    let idx = 0;
    // Merge paragraphs that are too small.
    while (idx < paragraphSplits.length) {
      if (idx < paragraphSplits.length - 1 && paragraphSplits[idx].length < chunkSize) {
        paragraphSplits[idx] = [paragraphSplits[idx], paragraphSplits[idx + 1]].join(this.paragraphSeparator);
        paragraphSplits.splice(idx + 1, 1);
      } else {
        idx += 1;
      }
    }
    const offsets = paragraphSplits.map((_, i) => paragraphSplits.slice(0, i).join(this.paragraphSeparator).length);
    return paragraphSplits.map((p, i) => {
      return { text: p, offset: offsets[i] };
    });
  }

  // Split text into sentences.
  private getSentenceSplits(text: string): TextSplit[] {
    // First split by paragraphs.
    const paragraphSplits = this.getParagraphSplits(text, this.chunkSize);
    // Next we split the text using the sentence tokenizer fn.
    const splits: TextSplit[] = [];
    for (const paragraph of paragraphSplits) {
      const sentenceSplits = this.chunkingTokenizerFn(paragraph.text);
      if (!sentenceSplits) {
        continue;
      }
      let curOffset = paragraph.offset ?? 0;
      for (const sentence_split of sentenceSplits) {
        splits.push({ text: sentence_split.trim(), offset: curOffset });
        curOffset += sentence_split.length;
      }
    }
    return splits;
  }

  /**
   * Splits sentences into chunks if necessary.
   *
   * This isn't great behavior because it can split down the middle of a
   * word or in non-English split down the middle of a Unicode codepoint
   * so the splitting is turned off by default. If you need it, please
   * set the splitLongSentences option to true.
   * @param sentenceSplits
   * @param effectiveChunkSize
   * @returns
   */
  private processSentenceSplits(sentenceSplits: TextSplit[]): TextSplit[] {
    if (!this.splitLongSentences) {
      return sentenceSplits.map((split) => ({
        text: split.text,
        numTokens: this.tokenizer(split.text).length,
        offset: split.offset,
      }));
    }

    const newSplits: TextSplit[] = [];
    for (const split of sentenceSplits) {
      const splitTokens = this.tokenizer(split.text);
      const splitLen = splitTokens.length;
      if (splitLen <= this.chunkSize) {
        newSplits.push({ text: split.text, numTokens: splitLen, offset: split.offset });
      } else {
        for (let i = 0; i < splitLen; i += this.chunkSize) {
          const cur_split = this.tokenizerDecoder(splitTokens.slice(i, i + this.chunkSize));
          newSplits.push({
            text: cur_split,
            offset: i + (split.offset ?? 0),
            numTokens: this.chunkSize,
          });
        }
      }
    }
    return newSplits;
  }

  // Combine the splits into a single split.
  private combineSplits(splits: TextSplit[]): TextSplit {
    return {
      text: splits.map((split) => split.text).join(' '),
      numTokens: splits.reduce((acc, split) => acc + split.numTokens!, 0),
      offset: splits[0].offset,
    };
  }

  // Combine the provided text splits into a new set of splits, where each
  // split is no larger than the chunk limit. Also, each split will have
  // the overlap size of the chunk overlap.
  private combineTextSplits(sentences: TextSplit[]): TextSplit[] {
    const chunks: TextSplit[] = [];
    // The set of sentences that will be combined into a chunk.
    let curSentences: TextSplit[] = [];
    let curTokens = 0;

    for (let i = 0; i < sentences.length; i++) {
      // If we would exceed the chunk size, push all of the current sentences
      // into a new chunk.
      if (curTokens + sentences[i].numTokens! > this.chunkSize) {
        chunks.push(this.combineSplits(curSentences));
        const lastSentences = curSentences;
        curTokens = 0;
        curSentences = [];

        // Push back the sentences at the end of the last chunk, so we end up with overlap
        // with the next chunk.
        for (let j = lastSentences.length - 1; j >= 0; j--) {
          if (curTokens + lastSentences[j].numTokens! > this.chunkOverlap) {
            break;
          }
          curSentences.unshift(lastSentences[j]);
          curTokens += lastSentences[j].numTokens!;
        }
      }
      curSentences.push(sentences[i]);
      curTokens += sentences[i].numTokens! + 1;
    }

    chunks.push(this.combineSplits(curSentences));
    return chunks;
  }

  // Split incoming text and return chunks with overlap size.
  // Has a preference for complete sentences, phrases, and minimal overlap.
  splitText(text: string): TextSplit[] {
    if (text == '') {
      return [];
    }
    // First split into sentences.
    const sentenceSplits = this.getSentenceSplits(text);
    // Check if any sentences exceed the chunk size. If they don't,
    // force split by tokenizer
    const newSentenceSplits = this.processSentenceSplits(sentenceSplits);
    // combine sentence splits into chunks of text that can then be returned
    const combinedTextSplits = this.combineTextSplits(newSentenceSplits);
    return combinedTextSplits;
  }
}
