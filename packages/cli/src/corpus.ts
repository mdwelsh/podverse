// import { config } from 'dotenv';
// config();
// import { Podcast, Episode } from 'podverse-types';
// import terminal from 'terminal-kit';
// const { terminal: term } = terminal;
// import { FixieClient } from 'fixie';
// import { FixieAgent } from 'fixie';

// export interface IndexOptions {
//   force?: boolean;
// }

// /** Index the given Podcast. */
// export async function IndexPodcast(podcast: Podcast, opts: IndexOptions): Promise<Podcast> {
//   if (podcast.corpusId && !opts.force) {
//     term('  Skipping indexing - already indexed.\n');
//     return podcast;
//   }
//   const transcriptUrls: string[] = podcast.episodes?.map((e) => e.transcriptUrl ?? '') ?? [];
//   const summaryUrls: string[] = podcast.episodes?.map((e) => e.summaryUrl ?? '') ?? [];
//   const client = FixieClient.Create();
//   const corpus = await client.createCorpus(podcast.title, `Podverse corpus for ${podcast.slug}`) as { corpus: { corpusId: string } };
//   const corpusId = corpus.corpus.corpusId;
//   await client.addCorpusSource(
//     corpusId,
//     transcriptUrls,
//     undefined,
//     undefined,
//     transcriptUrls.length,
//     1,
//     `Podverse transcript source for ${podcast.slug}`,
//     `${podcast.slug} transcripts`,
//   );
//   await client.addCorpusSource(
//     corpusId,
//     summaryUrls,
//     undefined,
//     undefined,
//     summaryUrls.length,
//     1,
//     `Podverse summary source for ${podcast.slug}`,
//     `${podcast.slug} summaries`,
//   );
//   term('  Creating corpus:').green(corpusId)(' - ').blue(transcriptUrls.length)(' transcripts, ').blue(summaryUrls.length)(' summaries\n');
//   podcast.corpusId = corpusId;
//   return podcast;
// }
