import OpenAI from 'openai';
import { EOL } from 'node:os';
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

/** Given the provided text, return a set of chunks. */
export function ChunkText(text: string): string[] {
  const splitter = new SentenceSplitter();
  return splitter.splitText(text);
}

export async function Embed(supabase: SupabaseClient, url: string, meta: object): Promise<number> {
  console.log(`Embedding page from ${url}`);
  const res = await fetch(url);
  const text = await res.text();
  const checksum = createHash('sha256').update(text).digest('base64');

  const chunks = ChunkText(text);
  const embeddings = await Promise.all(chunks.map((chunk) => CreateEmbedding(chunk)));

  // Create page entry.
  const { data: page, error } = await supabase
    .from('nods_page')
    .upsert(
      {
        checksum,
        path: url,
        type: 'transcript',
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

  for (let i = 0; i < chunks.length; i++) {
    const embedding = embeddings[i];
    const { error } = await supabase
      .from('nods_page_section')
      .insert({
        page_id: page.id,
        content: chunks[i],
        embedding,
      })
      .select()
      .limit(1)
      .single();
    if (error) {
      console.log('error inserting Embed chunk entry', error);
      throw error;
    }
  }
  console.log(`Embedded ${chunks.length} chunks for page ID ${page.id}`);
  return page.id;
}

/** Given the provided text, perform a vector search. */
// XXX TODO(mdw): Type the response more accurately.
export async function VectorSearch(supabase: SupabaseClient, input: string): Promise<object[]> {
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
  const { data, error } = await supabase.rpc('match_page_sections', {
    embedding: queryEmbedding,
    match_threshold: 0.8,
    match_count: 10,
    min_content_length: 50,
  });
  if (error) {
    console.log('Error performing lookup', error);
    throw error;
  }
  return data;
}

// The following is adapted from:
// https://github.com/run-llama/LlamaIndexTS/blob/main/packages/core/src/TextSplitter.ts
// We don't import it directly because LlamaIndexTS has a bunch of dependencies (including things
// like ONNX Runtime) that we don't want to pull in.

// TODO(mdw): Adapt the following to be more "transcript-aware", i.e., splitting on speaker
// boundaries.

class TextSplit {
  textChunk: string;
  numCharOverlap: number | undefined;

  constructor(textChunk: string, numCharOverlap: number | undefined = undefined) {
    this.textChunk = textChunk;
    this.numCharOverlap = numCharOverlap;
  }
}

type SplitRep = { text: string; numTokens: number };

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

// Refs: https://github.com/fxsjy/jieba/issues/575#issuecomment-359637511
const resentencesp = /([﹒﹔﹖﹗．；。！？]["’”」』]{0,2}|：(?=["‘“「『]{1,2}|$))/;
/**
 * Tokenizes sentences. Suitable for Chinese, Japanese, and Korean. Use instead of `defaultSentenceTokenizer`.
 * @param text
 * @returns string[]
 */
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
  private chunkingTokenizerFn: (text: string) => string[];
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
    chunkingTokenizerFn?: (text: string) => string[];
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
    // this._callback_manager = callback_manager || new CallbackManager([]);

    this.encoding = encodingForModel('text-embedding-ada-002'); // cl100k_base
    this.paragraphSeparator = paragraphSeparator;
    this.chunkingTokenizerFn = chunkingTokenizerFn ?? defaultSentenceTokenizer;
    this.splitLongSentences = splitLongSentences;
  }

  private getEffectiveChunkSize(extraInfoStr?: string): number {
    // get "effective" chunk size by removing the metadata
    let effectiveChunkSize;
    if (extraInfoStr != undefined) {
      const numExtraTokens = this.tokenizer(`${extraInfoStr}\n\n`).length + 1;
      effectiveChunkSize = this.chunkSize - numExtraTokens;
      if (effectiveChunkSize <= 0) {
        throw new Error('Effective chunk size is non positive after considering extra_info');
      }
    } else {
      effectiveChunkSize = this.chunkSize;
    }
    return effectiveChunkSize;
  }

  getParagraphSplits(text: string, effectiveChunkSize?: number): string[] {
    // get paragraph splits
    let paragraphSplits: string[] = text.split(this.paragraphSeparator);
    let idx = 0;
    if (effectiveChunkSize == undefined) {
      return paragraphSplits;
    }

    // merge paragraphs that are too small
    while (idx < paragraphSplits.length) {
      if (idx < paragraphSplits.length - 1 && paragraphSplits[idx].length < effectiveChunkSize) {
        paragraphSplits[idx] = [paragraphSplits[idx], paragraphSplits[idx + 1]].join(this.paragraphSeparator);
        paragraphSplits.splice(idx + 1, 1);
      } else {
        idx += 1;
      }
    }
    return paragraphSplits;
  }

  getSentenceSplits(text: string, effectiveChunkSize?: number): string[] {
    let paragraphSplits = this.getParagraphSplits(text, effectiveChunkSize);
    // Next we split the text using the chunk tokenizer fn/
    let splits = [];
    for (const parText of paragraphSplits) {
      const sentenceSplits = this.chunkingTokenizerFn(parText);

      if (!sentenceSplits) {
        continue;
      }

      for (const sentence_split of sentenceSplits) {
        splits.push(sentence_split.trim());
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
  private processSentenceSplits(sentenceSplits: string[], effectiveChunkSize: number): SplitRep[] {
    if (!this.splitLongSentences) {
      return sentenceSplits.map((split) => ({
        text: split,
        numTokens: this.tokenizer(split).length,
      }));
    }

    let newSplits: SplitRep[] = [];
    for (const split of sentenceSplits) {
      let splitTokens = this.tokenizer(split);
      const splitLen = splitTokens.length;
      if (splitLen <= effectiveChunkSize) {
        newSplits.push({ text: split, numTokens: splitLen });
      } else {
        for (let i = 0; i < splitLen; i += effectiveChunkSize) {
          const cur_split = this.tokenizerDecoder(splitTokens.slice(i, i + effectiveChunkSize));
          newSplits.push({ text: cur_split, numTokens: effectiveChunkSize });
        }
      }
    }
    return newSplits;
  }

  combineTextSplits(newSentenceSplits: SplitRep[], effectiveChunkSize: number): TextSplit[] {
    // go through sentence splits, combine to chunks that are within the chunk size

    // docs represents final list of text chunks
    let docs: TextSplit[] = [];
    // curChunkSentences represents the current list of sentence splits (that)
    // will be merged into a chunk
    let curChunkSentences: SplitRep[] = [];
    let curChunkTokens = 0;

    for (let i = 0; i < newSentenceSplits.length; i++) {
      // if adding newSentenceSplits[i] to curDocBuffer would exceed effectiveChunkSize,
      // then we need to add the current curDocBuffer to docs
      if (curChunkTokens + newSentenceSplits[i].numTokens > effectiveChunkSize) {
        if (curChunkSentences.length > 0) {
          // push curent doc list to docs
          docs.push(
            new TextSplit(
              curChunkSentences
                .map((sentence) => sentence.text)
                .join(' ')
                .trim(),
            ),
          );
        }

        const lastChunkSentences = curChunkSentences;

        // reset docs list
        curChunkTokens = 0;
        curChunkSentences = [];

        // add the last sentences from the last chunk until we've hit the overlap
        // do it in reverse order
        for (let j = lastChunkSentences.length - 1; j >= 0; j--) {
          if (curChunkTokens + lastChunkSentences[j].numTokens > this.chunkOverlap) {
            break;
          }
          curChunkSentences.unshift(lastChunkSentences[j]);
          curChunkTokens += lastChunkSentences[j].numTokens + 1;
        }
      }

      curChunkSentences.push(newSentenceSplits[i]);
      curChunkTokens += newSentenceSplits[i].numTokens + 1;
    }
    docs.push(
      new TextSplit(
        curChunkSentences
          .map((sentence) => sentence.text)
          .join(' ')
          .trim(),
      ),
    );
    return docs;
  }

  splitTextWithOverlaps(text: string, extraInfoStr?: string): TextSplit[] {
    // Split incoming text and return chunks with overlap size.
    // Has a preference for complete sentences, phrases, and minimal overlap.

    // here is the typescript code (skip callback manager)
    if (text == '') {
      return [];
    }

    let effectiveChunkSize = this.getEffectiveChunkSize(extraInfoStr);
    let sentenceSplits = this.getSentenceSplits(text, effectiveChunkSize);

    // Check if any sentences exceed the chunk size. If they don't,
    // force split by tokenizer
    let newSentenceSplits = this.processSentenceSplits(sentenceSplits, effectiveChunkSize);

    // combine sentence splits into chunks of text that can then be returned
    let combinedTextSplits = this.combineTextSplits(newSentenceSplits, effectiveChunkSize);

    return combinedTextSplits;
  }

  splitText(text: string, extraInfoStr?: string): string[] {
    const text_splits = this.splitTextWithOverlaps(text);
    const chunks = text_splits.map((text_split) => text_split.textChunk);
    return chunks;
  }
}
