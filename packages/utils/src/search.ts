import { SupabaseClient } from '@supabase/supabase-js';
import { VectorSearch } from './embed.js';

export interface SearchResultPodcast {
  id: number;
  slug: string;
  title: string;
  description?: string;
  imageUrl?: string;
}

export interface SearchResultEpisode {
  id: number;
  slug: string;
  title: string;
  description?: string;
  imageUrl?: string;
}

export interface SearchResult {
  kind: 'podcast' | 'episode' | 'vector';
  sourceUrl: string;
  content?: string;
  podcast?: SearchResultPodcast;
  episode?: SearchResultEpisode;
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
  const results: SearchResult[] = [];
  const episodeQuery = supabase.rpc('episode_search', { query: input, match_count: 10 });
  const podcastQuery = supabase.rpc('podcast_search', { query: input, match_count: 10 });
  const vectorQuery = includeVector ? VectorSearch({ supabase, input }) : Promise.resolve([]);
  const [episodeResults, podcastResults, vectorResults] = await Promise.all([episodeQuery, podcastQuery, vectorQuery]);

  // Get the set of podcasts and episodes that we need metadata for.
  // We first fetch the podcasts and documents in parallel.
  const podcasts = new Map();
  const documents = new Map();
  const episodes = new Map();

  const podcastIds = new Set();
  const documentIds = new Set();
  const episodeIds = new Set();

  console.log(JSON.stringify(episodeResults, null, 2));

  console.log(`${episodeResults.data.length} episode results`);
  for (const episodeData of episodeResults.data || []) {
    console.log('EPISODE RESULT');
    console.log(episodeData);
    podcastIds.add(episodeData.podcast);
  }
  for (const result of vectorResults) {
    documentIds.add(result.documentId);
  }

  const podcastMetadataQueries = [...podcastIds].map((podcastId) =>
    supabase.from('Podcasts').select('*').eq('id', podcastId).limit(1),
  );
  const documentMetadataQueries = [...documentIds].map((documentId) =>
    supabase.from('Documents').select('*').eq('id', documentId).limit(1),
  );
  const [podcastMetadata, documentMetadata] = await Promise.all([podcastMetadataQueries, documentMetadataQueries]);
  for (const podcastResult of podcastMetadata) {
    const { data, error } = await podcastResult;
    if (error || !data || data.length === 0) {
      console.warn(`No podcast found for podcastId ${podcastResult}`);
      continue;
    }
    const podcast = data[0];
    podcasts.set(podcast.id, podcast);
  }

  // Next get the metadata for the episodes referenced by the documents.
  for (const documentResult of documentMetadata) {
    const { data, error } = await documentResult;
    if (error || !data || data.length === 0) {
      console.warn(`No document found for ${documentResult}`);
      continue;
    }
    const document = data[0];
    documents.set(document.id, document);
    const episodeId = document.episode as string;
    episodeIds.add(episodeId);
  }
  const episodeMetadataqueries = [...episodeIds].map((episodeId) =>
    supabase.from('Episodes').select('*').eq('id', episodeId).limit(1),
  );
  const episodeMetadata = await Promise.all(episodeMetadataqueries);
  for (const episodeResult of episodeMetadata) {
    const { data, error } = episodeResult;
    if (error || !data || data.length === 0) {
      console.warn(`No episode found for ${episodeResult}`);
      continue;
    }
    const episode = data[0];
    episodes.set(episode.id, episode);
  }

  // Now build the results.
  for (const podcastData of podcastResults.data || []) {
    results.push({
      kind: 'podcast',
      sourceUrl: `/podcast/${podcastData.slug}`,
      content: podcastData.description,
      podcast: {
        id: podcastData.id,
        slug: podcastData.slug,
        title: podcastData.title,
        description: podcastData.description,
        imageUrl: podcastData.imageUrl,
      },
    });
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
      podcast: {
        id: podcast.id,
        slug: podcast.slug,
        title: podcast.title,
        description: podcast.description,
        imageUrl: podcast.imageUrl,
      },
      episode: {
        id: episodeData.id,
        slug: episodeData.slug,
        title: episodeData.title,
        description: episodeData.description,
        imageUrl: episodeData.imageUrl,
      },
    });
  }

  for (const result of vectorResults) {
    const document = documents.get(result.documentId) || undefined;
    if (!document) {
      console.warn(`No document found for document ID ${result.documentId}`);
      continue;
    }
    const episode = episodes.get(document.episode) || undefined;
    if (!episode) {
      console.warn(`No episode found for episode ID ${document.episode}`);
      continue;
    }
    const podcast = podcasts.get(episode.podcast) || undefined;
    if (!podcast) {
      console.warn(`No podcast found for episode ${episode.podcast}`);
      continue;
    }

    const meta: { startTime?: number } = result.meta || ({} as { startTime?: number });
    results.push({
      kind: 'vector',
      content: result.content,
      sourceUrl: `/podcast/${podcast.slug}/episode/${episode.slug}`,
      startTime: meta.startTime,
      podcast: {
        id: podcast.id,
        slug: podcast.slug,
        title: podcast.title,
        description: podcast.description,
        imageUrl: podcast.imageUrl,
      },
      episode: {
        id: episode.id,
        slug: episode.slug,
        title: episode.title,
        description: episode.description,
        imageUrl: episode.imageUrl,
      },
    });
  }
  return results;
}
