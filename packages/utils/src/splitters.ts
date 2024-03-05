/** This module contains code to split text and transcripts for chunking. */

import { Tiktoken, encodingForModel } from 'js-tiktoken';
import { SyncPrerecordedResponse } from '@deepgram/sdk';

const DEFAULT_CHUNK_SIZE = 1024;
const DEFAULT_CHUNK_OVERLAP = 20;

/** Represents a chunk of text. */
export type TextSplit = {
  // The contents of the text.
  text: string;
  // The number of tokens of the text, if it has been calculated.
  numTokens?: number;
  // Metadata associated with this split.
  meta?: TextSplitMetadata;
};

export type TextSplitMetadata = {
  charOffset?: number;
  startTime?: number;
  endTime?: number;
};

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

export class TextSplitter {
  private chunkSize: number;
  private chunkOverlap: number;
  private paragraphSeparator: string;
  private chunkingTokenizerFn: (_text: string) => string[];
  private splitLongSentences: boolean;
  private encoding: Tiktoken;

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

    // TODO(mdw): Make the below a singleton.
    this.encoding = encodingForModel('text-embedding-ada-002'); // cl100k_base
    this.paragraphSeparator = paragraphSeparator;
    this.chunkingTokenizerFn = chunkingTokenizerFn ?? defaultSentenceTokenizer;
    this.splitLongSentences = splitLongSentences;
  }

  private tokenizer(text: string): Uint32Array {
    return new Uint32Array(this.encoding.encode(text));
  }

  private tokenizerDecoder(tokens: Uint32Array): string {
    const numberArray = Array.from(tokens);
    const text = this.encoding.decode(numberArray);
    const uint8Array = new TextEncoder().encode(text);
    return new TextDecoder().decode(uint8Array);
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
      return { text: p, meta: { charOffset: offsets[i] } };
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
      let curOffset = paragraph.meta?.charOffset ?? 0;
      for (const sentence_split of sentenceSplits) {
        splits.push({ text: sentence_split.trim(), meta: { charOffset: curOffset } });
        curOffset += sentence_split.length;
      }
    }
    return splits;
  }

  /** Splits long sentences into individual chunks if necessary. */
  private processSentenceSplits(sentenceSplits: TextSplit[]): TextSplit[] {
    if (!this.splitLongSentences) {
      return sentenceSplits.map((split) => ({
        text: split.text,
        numTokens: this.tokenizer(split.text).length,
        meta: split.meta,
      }));
    }

    const newSplits: TextSplit[] = [];
    for (const split of sentenceSplits) {
      const splitTokens = this.tokenizer(split.text);
      const splitLen = splitTokens.length;
      if (splitLen <= this.chunkSize) {
        // Sentence fits into a single chunk.
        newSplits.push({ text: split.text, numTokens: splitLen, meta: split.meta });
      } else {
        // Sentence needs to be split.
        let curOffset = 0;
        for (let i = 0; i < splitLen; i += this.chunkSize) {
          const cur_split = this.tokenizerDecoder(splitTokens.slice(i, i + this.chunkSize));
          newSplits.push({
            text: cur_split,
            meta: {
              ...split.meta,
              charOffset: split.meta?.charOffset !== undefined ? curOffset + (split.meta?.charOffset ?? 0) : undefined,
            },
            numTokens: this.tokenizer(cur_split).length,
          });
          curOffset += cur_split.length;
        }
      }
    }
    return newSplits;
  }

  // Combine the splits into a single split.
  private combineSplits(splits: TextSplit[]): TextSplit {
    if (splits.length === 0) {
      return { text: '', numTokens: 0 };
    }
    const meta = {
      charOffset: splits[0].meta?.charOffset ?? undefined,
      startTime: splits[0].meta?.startTime ?? undefined,
      endTime: splits[splits.length - 1].meta?.endTime ?? undefined,
    };
    return {
      text: splits.map((split) => split.text).join(' '),
      numTokens: splits.reduce((acc, split) => acc + split.numTokens!, 0),
      meta,
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
      curTokens += sentences[i].numTokens!;
    }
    chunks.push(this.combineSplits(curSentences));
    return chunks;
  }

  /** Split incoming text and return chunks with overlap. */
  splitText(text: string): TextSplit[] {
    if (text == '') {
      return [];
    }
    const sentenceSplits = this.getSentenceSplits(text);
    const newSentenceSplits = this.processSentenceSplits(sentenceSplits);
    const combinedTextSplits = this.combineTextSplits(newSentenceSplits);
    return combinedTextSplits;
  }

  /** Split the provided transcript and return chunks with overlap. */
  splitTranscript(transcript: SyncPrerecordedResponse): TextSplit[] {
    const paragraphs = transcript.results.channels[0].alternatives[0].paragraphs?.paragraphs;
    if (!paragraphs) {
      return [];
    }
    const sentenceSplits = [];
    for (const paragraph of paragraphs) {
      for (const sentence of paragraph.sentences) {
        const meta = {
          startTime: sentence.start,
          endTime: sentence.end,
        };
        sentenceSplits.push({ text: sentence.text, offset: sentence.start, meta });
      }
    }
    const newSentenceSplits = this.processSentenceSplits(sentenceSplits);
    const combinedTextSplits = this.combineTextSplits(newSentenceSplits);
    return combinedTextSplits;
  }
}
