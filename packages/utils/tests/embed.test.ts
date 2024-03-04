/** Unit tests for client.ts. */

import { jest, afterEach, describe, expect, it } from '@jest/globals';
import { ChunkText } from '../src/embed.js';

describe('FixieAgentBase Agent tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('ChunkText works', () => {
    const chunks = ChunkText('This is a test.');
    expect(chunks.length).toBe(3);
    expect(chunks[0]).toBe('This');
    expect(chunks[1]).toBe(' is ');
    expect(chunks[2]).toBe('a te');
  });
});
