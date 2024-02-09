/**
 * This is a command-line utility to manage the set of Podcasts in the Podverse app.
 */

import { config } from 'dotenv';
config();

import { program } from 'commander';
import terminal from 'terminal-kit';
const { terminal: term } = terminal;
import { Ingest } from './podcast.js';
import supabase from './supabase.js';
import { GetPodcast, GetPodcasts, GetPodcastWithEpisodes, DeletePodcast } from 'podverse-utils';
//import { ProcessPodcast } from './process.js';
//import { IndexPodcast } from './corpus.js';
//import { Summarize } from './summary.js';
import { dump, load } from 'js-yaml';
import fs from 'fs';
import { Inngest } from 'inngest';

/** Describes the configuration file YAML format. */
interface PodcastConfig {
  slug: string;
  rssUrl: string;
}

interface ConfigFile {
  podcasts: PodcastConfig[];
}

program.name('podverse-cli').version('0.0.1').description('CLI for managing Podverse state.');

program
  .command('list')
  .description('List all podcasts in the Podverse app.')
  .action(async () => {
    const podcasts = await GetPodcasts(supabase);
    for (const podcast of podcasts) {
      term(podcast.slug + ': ')
        .green(podcast.title + ' ')
        .blue(podcast.rssUrl + '\n');
    }
  });

program
  .command('get')
  .description('Get a podcast from the Podverse app.')
  .argument('<slug>', 'Slug of the podcast to get.')
  .option('--episodes', 'Return episodes as well.')
  .action(async (slug: string, opts) => {
    if (opts.episodes) {
      const podcast = await GetPodcastWithEpisodes(supabase, slug);
      console.log(JSON.stringify(podcast, null, 4));
    } else {
      const podcast = await GetPodcast(supabase, slug);
      console.log(JSON.stringify(podcast, null, 4));
    }
  });

program
  .command('ingest')
  .description('Ingest a podcast into the Podverse app.')
  .argument('<podcastUrl>', 'URL of the podcast RSS feed.')
  .action(async (podcastUrl: string) => {
    try {
      const podcast = await Ingest({ supabase, podcastUrl });
      term('Ingested podcast: ').green(podcast.slug)(` (${podcast.Episodes?.length} episodes)\n`);
    } catch (err) {
      term('Error ingesting podcast: ').red(err);
    }
  });

program
  .command('delete')
  .description('Delete a podcast from the Podverse app.')
  .argument('<slug>', 'Slug of the podcast to delete.')
  .action(async (slug: string) => {
    await DeletePodcast(supabase, slug);
    term('Deleted podcast: ').green(slug + '\n');
  });

program
  .command('ingest-all')
  .description('Ingest all podcasts from the given YAML file.')
  .argument('<filename>', 'YAML file to read the podcast list from.')
  .action(async (filename: string) => {
    let created = 0;
    let skipped = 0;
    const configFile = load(fs.readFileSync(filename, 'utf8')) as ConfigFile;
    for (const podcastConfig of configFile.podcasts) {
      try {
        // Check to see if it exists.
        const p = await GetPodcast(supabase, podcastConfig.slug);
        term.yellow('Skipping: ').green(podcastConfig.slug + '\n');
        skipped += 1;
        continue;
      } catch (err) {
        // Assume the podcast does not exist, let's create it.
        term()
          .blue('Creating: ')
          .green(podcastConfig.slug + '\n');
      }
      try {
        const podcast = await Ingest({ slug: podcastConfig.slug, supabase, podcastUrl: podcastConfig.rssUrl });
        term('Ingested podcast: ').green(podcast.slug)(` (${podcast.Episodes?.length} episodes)\n`);
        created += 1;
      } catch (err) {
        term('Error ingesting podcast: ').red(err);
      }
    }
    term('Ingested podcasts from ').green(filename)(`: ${created} created, ${skipped} skipped.\n`);
  });

program
  .command('dump')
  .description('Save the current podcast list to a YAML file.')
  .argument('<filename>', 'YAML file to save the list to.')
  .action(async (filename: string) => {
    const podcasts = await GetPodcasts(supabase);
    const config: ConfigFile = {
      podcasts: podcasts.map((podcast) => {
        return {
          slug: podcast.slug,
          rssUrl: podcast.rssUrl || '',
        };
      }),
    };
    fs.writeFile(filename, dump(config), (err) => {
      if (err) {
        console.log(err);
      }
    });
    term('Wrote config to ').green(filename);
  });

program
  .command('refresh')
  .description('Refresh podcast episodes by adding new episodes from their RSS feeds.')
  .argument('[slug]', 'Slug of the podcast to refresh. If not specified, all podcasts will be refreshed.')
  .action(async (slug: string) => {
    let slugs: string[] = [];
    if (slug) {
      slugs.push(slug);
    } else {
      slugs = await GetPodcasts(supabase).then((podcasts) => podcasts.map((podcast) => podcast.slug));
    }
    for (const slug of slugs) {
      const podcast = await GetPodcastWithEpisodes(supabase, slug);
      if (!podcast.rssUrl) {
        term('Unable to refresh, as podcast is missing RSS URL: ').red(slug + '\n');
        continue;
      }
      const newPodcast = await Ingest({ slug, supabase, podcastUrl: podcast.rssUrl, refresh: true });
      const diff = (newPodcast.Episodes?.length ?? 0) - (podcast.Episodes?.length ?? 0);
      term('Refreshed podcast: ').green(slug)(` (${newPodcast.Episodes?.length} episodes, ${diff} new)\n`);
    }
  });

program
  .command('process')
  .description('Send Inngest event to start processing.')
  .option('--dev', 'Use the local development Inngest environment.')
  .action(async (opts) => {
    try {
      let eventKey: string | undefined = process.env.INNGEST_EVENT_KEY;
      if (opts.dev) {
        eventKey = undefined;
      } else if (!eventKey) {
        throw new Error('Missing INNGEST_EVENT_KEY environment variable.');
      }
      const inngest = new Inngest({ id: 'podverse-app', eventKey });
      await inngest.send({
        name: 'process/episodes',
        data: {},
      });
      term.green('Started processing.\n');
    } catch (err) {
      term('Error sending process event: ').red(err);
    }
  });

program
  .command('transcribe')
  .description('Send Inngest event to transcribe episode.')
  .argument('<episodeId>', 'ID of the episode to transcribe.')
  .option('--dev', 'Use the local development Inngest environment.')
  .action(async (episodeId, opts) => {
    try {
      let eventKey: string | undefined = process.env.INNGEST_EVENT_KEY;
      if (opts.dev) {
        eventKey = undefined;
      } else if (!eventKey) {
        throw new Error('Missing INNGEST_EVENT_KEY environment variable.');
      }
      const inngest = new Inngest({ id: 'podverse-app', eventKey });
      await inngest.send({
        name: 'process/transcribe',
        data: {
          episodeId: parseInt(episodeId),
        },
      });
      term.green(`Started transcription for episode ${episodeId}.\n`);
    } catch (err) {
      term('Error sending process event: ').red(err);
    }
  });

// program
//   .command('process [podcast]')
//   .description('Process the given podcast, or all podcasts if not specified.')
//   .option('-f, --force', 'Force re-processing of already-processed episodes.')
//   .option('--no-transcribe', 'Disable audio transcription.')
//   .option('--no-summarize', 'Disable summarization.')
//   .option('--max-episodes [number]', 'Maximum number of episodes to process.')
//   .action(async (podcast: string | null, opts) => {
//     const podcasts = podcast ? [podcast] : await ListPodcasts();
//     for (const podcastSlug of podcasts) {
//       term('Processing: ').green(`${podcastSlug}...\n`);
//       const podcast = await GetPodcast(podcastSlug);
//       const processed = await ProcessPodcast(podcast, {
//         transcribe: opts.transcribe,
//         summarize: opts.summarize,
//         force: opts.force,
//         maxEpisodes: opts.maxEpisodes,
//       });
//       await SetPodcast(processed);
//       term('Finished processing: ').green(`${podcastSlug}\n`);
//     }
//   });

// program
//   .command('index [podcast]')
//   .description('Generate a Fixie Corpus for the given podcast, or all podcasts if not specified.')
//   .option('-f, --force', 'Force re-indexing of already-processed podcasts.')
//   .action(async (podcast: string | null, opts) => {
//     const podcasts = podcast ? [podcast] : await ListPodcasts();
//     for (const podcastSlug of podcasts) {
//       term('Indexing: ').green(`${podcastSlug}...\n`);
//       const podcast = await GetPodcast(podcastSlug);
//       const indexed = await IndexPodcast(podcast, { force: opts.force });
//       await SetPodcast(indexed);
//       term('Started indexing: ').green(`${podcastSlug}\n`);
//     }
//   });

// program
//   .command('summarize <url>')
//   .description('Summarize the text content at the given URL.')
//   .action(async (url: string) => {
//     term(`Summarizing ${url}...`);
//     const res = await fetch(url);
//     const text = await res.text();
//     const result = await Summarize(text);
//     term('Summary:\n').green(result + '\n');
//   });

program.parse(process.argv);
