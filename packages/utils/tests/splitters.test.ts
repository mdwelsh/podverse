/** Unit tests for client.ts. */

import { jest, afterEach, describe, expect, it } from '@jest/globals';
import { TextSplitter } from '../src/splitters.js';
import fs from 'fs';

function generate(numWords: number): string {
  return Array.from({ length: numWords }, (_, i) => i)
    .map((value) => `word-${value}`)
    .join(' ');
}

describe('splitText tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Works with short sentence', () => {
    const text = 'This is a test.';
    const splitter = new TextSplitter({ splitLongSentences: true });
    const chunks = splitter.splitText(text);
    expect(chunks.length).toBe(1);
    expect(chunks[0].text).toBe(text);
    expect(chunks[0].meta?.charOffset).toBe(0);
    expect(chunks[0].numTokens).toBe(5);
  });

  it('Works with longer sentence', () => {
    const text =
      'This is a test of a longer sentence to ensure that the ChunkText code that we have does the right thing. It should still work with multiple sentences as long as they fit within a single chunk.';
    const splitter = new TextSplitter({ splitLongSentences: true });
    const chunks = splitter.splitText(text);
    expect(chunks.length).toBe(1);
    expect(chunks[0].text).toBe(text);
    expect(chunks[0].meta?.charOffset).toBe(0);
    expect(chunks[0].numTokens).toBe(40);
  });

  it('Works with very long sentence', () => {
    const text = generate(2000) + '.';
    const splitter = new TextSplitter({ splitLongSentences: true });
    const chunks = splitter.splitText(text);
    expect(chunks.length).toBe(14);
    expect(chunks[0].meta?.charOffset).toBe(0);
    expect(chunks[0].numTokens).toBe(512);
    expect(chunks[1].meta?.charOffset).toBe(chunks[0].text.length);
    expect(chunks[1].numTokens).toBe(512);
    expect(chunks[2].meta?.charOffset).toBe(chunks[1].meta!.charOffset! + chunks[1].text.length);
    expect(chunks[2].numTokens).toBe(512);
    expect(chunks[13].numTokens).toBeLessThan(512);
  });

  it('Works with multiple paragraphs', () => {
    // Each of these paragraphs should fit into a single chunk, with overlap from the next one.
    const text = Array.from({ length: 4 }, (_, i) => i)
      .map((i) => `This is paragraph ${i}. ${generate(100)}.`)
      .join('\n\n');
    const splitter = new TextSplitter({ splitLongSentences: true });
    const chunks = splitter.splitText(text);
    expect(chunks.length).toBe(4);
    expect(chunks[0].text.indexOf('This is paragraph 0.')).toBe(0);
    expect(chunks[0].text.indexOf('This is paragraph 1.')).toBe(chunks[0].text.length - 'This is paragraph 1.'.length);
    expect(chunks[1].text.indexOf('This is paragraph 1.')).toBe(0);
    expect(chunks[1].text.indexOf('This is paragraph 2.')).toBe(chunks[1].text.length - 'This is paragraph 2.'.length);
    expect(chunks[2].text.indexOf('This is paragraph 2.')).toBe(0);
    expect(chunks[2].text.indexOf('This is paragraph 3.')).toBe(chunks[2].text.length - 'This is paragraph 3.'.length);
    expect(chunks[3].text.indexOf('This is paragraph 3.')).toBe(0);
  });
});

describe('splitTranscript tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Works with a real transcript', () => {
    const transcriptFilename = 'tests/fixtures/transcript.json';
    const text = fs.readFileSync(transcriptFilename, 'utf-8');
    const transcript = JSON.parse(text);
    const splitter = new TextSplitter({ splitLongSentences: true });
    const chunks = splitter.splitTranscript(transcript);

    expect(chunks.length).toBe(34);
    expect(chunks[0].text.indexOf('And Receiving this message.')).toBe(0);
    expect(chunks[0].numTokens).toBe(505);
    expect(chunks[0].meta?.startTime).toBe(5.92);
    expect(chunks[0].meta?.endTime).toBe(181.04001);

    expect(chunks[32].text.indexOf("So by Diddy's corollary,")).toBe(1558);
    expect(chunks[33].numTokens).toBe(220);
    expect(chunks[33].meta?.startTime).toBe(4464.98);
    expect(chunks[33].meta?.endTime).toBe(4525.815);
  });
});
