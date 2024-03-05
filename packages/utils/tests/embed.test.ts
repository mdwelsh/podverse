/** Unit tests for client.ts. */

import { jest, afterEach, describe, expect, it } from '@jest/globals';
import { ChunkText } from '../src/embed.js';

function generate(numWords: number): string {
  return Array.from({ length: numWords }, (_, i) => i)
    .map((value) => `word-${value}`)
    .join(' ');
}

describe('ChunkText tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Works with short sentence', () => {
    const text = 'This is a test.';
    const chunks = ChunkText(text);
    expect(chunks.length).toBe(1);
    expect(chunks[0].text).toBe(text);
    expect(chunks[0].offset).toBe(0);
    expect(chunks[0].numTokens).toBe(5);
  });

  it('Works with longer sentence', () => {
    const text =
      'This is a test of a longer sentence to ensure that the ChunkText code that we have does the right thing. It should still work with multiple sentences as long as they fit within a single chunk.';
    const chunks = ChunkText(text);
    expect(chunks.length).toBe(1);
    expect(chunks[0].text).toBe(text);
    expect(chunks[0].offset).toBe(0);
    expect(chunks[0].numTokens).toBe(40);
  });

  it('Works with very long sentence', () => {
    const text = generate(2000) + '.';
    const chunks = ChunkText(text);
    expect(chunks.length).toBe(7);
    expect(chunks[0].offset).toBe(0);
    expect(chunks[0].numTokens).toBe(1024);
    expect(chunks[1].offset).toBe(chunks[0].text.length);
    expect(chunks[1].numTokens).toBe(1024);
    expect(chunks[2].offset).toBe(chunks[1].offset! + chunks[1].text.length);
    expect(chunks[2].numTokens).toBe(1024);
    expect(chunks[6].numTokens).toBeLessThan(1024);
  });

  it('Works with multiple paragraphs', () => {
    // Each of these paragraphs should fit into a single chunk, with overlap from the next one.
    const text = Array.from({ length: 4 }, (_, i) => i).map((i) => `This is paragraph ${i}. ${generate(200)}.`).join('\n\n');
    const chunks = ChunkText(text);
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
