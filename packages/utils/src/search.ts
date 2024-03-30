import { SupabaseClient } from '@supabase/supabase-js';
import { VectorSearch } from './embed.js';
import { GetEpisodeWithPodcast } from './storage.js';

export interface SearchResult {
  kind: 'podcast' | 'episode' | 'vector';
  sourceUrl: string;
  content?: string;
  podcastTitle?: string;
  episodeTitle?: string;
  // Only relevant for transcript search results.
  startTime?: number;
}

/**
 * Perform a "smart" search using both vector and full-text search across both embedded content
 * and podcast/episode metadata.
 */
export async function Search({
  supabase,
  input,
  includeVector = true,
}: {
  supabase: SupabaseClient;
  input: string;
  includeVector?: boolean;
}): Promise<SearchResult[]> {
  const episodeQuery = supabase.rpc('episode_search', { query: input, match_count: 10 });
  const podcastQuery = supabase.rpc('podcast_search', { query: input, match_count: 10 });
  const vectorQuery = includeVector ? VectorSearch({ supabase, input }) : Promise.resolve([]);

  const [episodeResults, podcastResults, vectorResults] = await Promise.all([episodeQuery, podcastQuery, vectorQuery]);

  const results: SearchResult[] = [];

  console.log(podcastResults);
  console.log(episodeResults);

  for (const podcastData of podcastResults.data || []) {
    results.push({
      kind: 'podcast',
      sourceUrl: `/podcast/${podcastData.slug}`,
      content: podcastData.description,
      podcastTitle: podcastData.title,
    });
  }

  // Get set of podcast IDs referenced by Episode results.
  const podcastIds = new Set();
  for (const episodeData of episodeResults.data || []) {
    podcastIds.add(episodeData.podcast);
  }

  // Get metadata for every referenced podcast.
  const podcastMetadataQueries = [...podcastIds].map((podcastId) =>
    supabase.from('Podcasts').select('*').eq('id', podcastId),
  );
  const podcastMetadata = await Promise.all(podcastMetadataQueries);
  const podcasts = new Map();
  for (const podcastResult of podcastMetadata) {
    const { data, error } = podcastResult;
    if (error || !data || data.length === 0) {
      console.warn(`No podcast found for podcastId ${podcastResult}`);
      continue;
    }
    const podcast = data[0];
    podcasts.set(podcast.id, podcast);
  }

  for (const episodeData of episodeResults.data || []) {
    const podcast = podcasts.get(episodeData.podcast) || undefined;
    if (!podcast) {
      console.warn(`No podcast found for episode ${episodeData.id}`);
      continue;
    }
    results.push({
      kind: 'episode',
      sourceUrl: `/podcast/${podcast.slug}/episode/${episodeData.slug}`,
      content: episodeData.description,
      podcastTitle: podcast.title,
      episodeTitle: episodeData.title,
    });
  }

  for (const result of vectorResults) {
    const { data, error } = await supabase.from('Documents').select('id, episode').eq('id', result.documentId);
    if (error || !data || data.length === 0) {
      console.warn(`No document found for documentId ${result.documentId}`);
      continue;
    }
    const episodeId = data[0].episode as string;
    const episode = await GetEpisodeWithPodcast(supabase, parseInt(episodeId));
    const meta: { startTime?: number } = result.meta || ({} as { startTime?: number });
    results.push({
      kind: 'vector',
      content: result.content,
      sourceUrl: `/podcast/${episode.podcast.slug}/episode/${episode.slug}`,
      podcastTitle: episode.podcast.title,
      episodeTitle: episode.title,
      startTime: meta.startTime,
    });
  }
  return results;
}
