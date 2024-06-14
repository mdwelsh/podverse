import { SupabaseClient } from '@supabase/supabase-js';
import { VectorSearch } from './embed.js';
import { GetPodcast } from './storage.js';

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
  podcastSlug,
  includeVector = true,
}: {
  supabase: SupabaseClient;
  input: string;
  podcastSlug?: string;
  includeVector?: boolean;
}): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  console.log(`Searching for "${input}" in podcast ${podcastSlug}`);
  const podcast = podcastSlug ? await GetPodcast(supabase, podcastSlug) : null;

  const episodeQuery = supabase.rpc('episode_search', {
    query: input,
    podcast_slug: podcastSlug || null,
    match_count: 10,
  });
  // For now, we are not searching for podcasts, only within a single podcast.
  //const podcastQuery = supabase.rpc('podcast_search', { query: input, match_count: 10 });
  const vectorQuery = includeVector
    ? VectorSearch({ supabase, input, podcastId: podcast ? podcast.id : undefined })
    : Promise.resolve([]);
  const [episodeResults, vectorResults] = await Promise.all([episodeQuery, vectorQuery]);
  console.log(`Got back ${episodeResults.data.length} episodes and ${vectorResults.length} vectors`);

  // Get the set of podcasts and episodes that we need metadata for.
  // We first fetch the podcasts and documents in parallel.
  const podcasts = new Map();
  const documents = new Map();
  const episodes = new Map();

  const podcastIds = new Set();
  const documentIds = new Set();
  const episodeIds = new Set();

  let podcastMetadataQueries = null;
  if (!podcastSlug) {
    for (const episodeData of episodeResults.data || []) {
      podcastIds.add(episodeData.podcast);
    }
    console.log(`Found ${podcastIds.size} unique podcasts in episode results`);
    podcastMetadataQueries = [...podcastIds].map((podcastId) =>
      supabase.from('Podcasts').select('*').eq('id', podcastId).limit(1),
    );
  } else {
    podcastMetadataQueries = Promise.resolve([]);
  }

  for (const result of vectorResults) {
    documentIds.add(result.documentId);
  }
  console.log(`Found ${documentIds.size} unique documents in vector results`);
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
  console.log(`Vector results have ${episodeIds.size} episodes`);
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

  // For now, we're not including podcast results since searches are limited to a single podcast.
  // for (const podcastData of podcastResults.data || []) {
  //   results.push({
  //     kind: 'podcast',
  //     sourceUrl: `/podcast/${podcastData.slug}`,
  //     content: podcastData.description,
  //     podcast: {
  //       id: podcastData.id,
  //       slug: podcastData.slug,
  //       title: podcastData.title,
  //       description: podcastData.description,
  //       imageUrl: podcastData.imageUrl,
  //     },
  //   });
  // }

  // When building the results, we want to retain the original ordering of the results,
  // but deduplicate based on episodeId.
  const episodeResultSet = new Set<string>();
  for (const episodeData of episodeResults.data || []) {
    if (episodeResultSet.has(episodeData.id.toString())) {
      continue;
    }
    episodeResultSet.add(episodeData.id.toString());

    const episodePodcast = podcast || podcasts.get(episodeData.podcast) || undefined;
    if (!episodePodcast) {
      console.warn(`No podcast found for episode ${episodeData.id}`);
      continue;
    }
    results.push({
      kind: 'episode',
      sourceUrl: `/podcast/${episodePodcast.slug}/episode/${episodeData.slug}`,
      content: episodeData.description,
      podcast: {
        id: episodePodcast.id,
        slug: episodePodcast.slug,
        title: episodePodcast.title,
        description: episodePodcast.description,
        imageUrl: episodePodcast.imageUrl,
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

  for (const vectorData of vectorResults) {
    const document = documents.get(vectorData.documentId) || undefined;
    if (!document) {
      console.warn(`No document found for document ID ${vectorData.documentId}`);
      continue;
    }
    if (episodeResultSet.has(document.episode.toString())) {
      continue;
    }
    episodeResultSet.add(document.episode.toString());

    const episode = episodes.get(document.episode) || undefined;
    if (!episode) {
      console.warn(`No episode found for episode ID ${document.episode}`);
      continue;
    }
    const docPodcast = podcast || podcasts.get(episode.podcast) || undefined;
    if (!docPodcast) {
      console.warn(`No podcast found for podcast ID ${episode.podcast}`);
      continue;
    }
    results.push({
      kind: 'episode',
      sourceUrl: `/podcast/${docPodcast.slug}/episode/${episode.slug}`,
      content: episode.description,
      podcast: {
        id: docPodcast.id,
        slug: docPodcast.slug,
        title: docPodcast.title,
        description: docPodcast.description,
        imageUrl: docPodcast.imageUrl,
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
  console.log(`Returning ${results.length} search results`);
  return results;
}
