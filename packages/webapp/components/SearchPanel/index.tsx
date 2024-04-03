'use client';

import { useRef, useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { search, getPodcast } from '@/lib/actions';
import { SearchResult } from 'podverse-utils';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

export function SearchPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [open, setOpen] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const onSubmit = () => {
    setBusy(true);
    search(query.trim())
      .then((results) => {
        setResults(results);
        setBusy(false);
      })
      .catch((error) => {
        console.error('Search error:', error);
        setError(error);
        setBusy(false);
      });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger>
        <div className="flex flex-row gap-2 text-primary font-mono text-sm">
          <MagnifyingGlassIcon className="h-6 w-6 text-primary" />
          Search
        </div>
      </SheetTrigger>
      <SheetContent side="top">
        <div className="mx-auto w-full max-h-screen md:w-3/5 rounded-md p-4 flex flex-col gap-4">
          <div className="flex flex-row gap-2 items-center">
            <Input
              defaultValue={query}
              onChange={onChange}
              ref={inputRef}
              type="text"
              placeholder="Search for podcasts and episodes"
              className="w-full"
            />
            <Button onClick={onSubmit} disabled={query.trim() === ''} variant="secondary">
              Search
            </Button>
            <Button onClick={() => setOpen(false)} variant="outline">
              Cancel
            </Button>
          </div>
          <SearchResults results={results} error={error} busy={busy} onLinkClicked={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SearchResults({
  results,
  error,
  busy,
  onLinkClicked,
}: {
  results: SearchResult[];
  error: Error | null;
  busy: boolean;
  onLinkClicked: () => void;
}) {
  const podcastResults = results.filter((result) => result.kind === 'podcast');
  const episodeResults = results.filter((result) => result.kind === 'episode');

  return (
    <div className="w-full flex flex-col gap-4 max-h-full overflow-y-scroll">
      {busy && <BusyState />}
      {error && <div className="text-red-500 text-sm font-mono">{error.message}</div>}
      {podcastResults.length > 0 && !busy && <div className="font-mono">Podcasts</div>}
      {!busy && podcastResults.map((result, index) => <PodcastResultCard key={index} result={result} onLinkClicked={onLinkClicked} />)}
      {episodeResults.length > 0 && !busy && <div className="font-mono">Episodes</div>}
      {!busy && episodeResults.map((result, index) => <EpisodeResultCard key={index} result={result} onLinkClicked={onLinkClicked} />)}
    </div>
  );
}

function BusyState() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="w-full h-[120px]" />
      <Skeleton className="w-full h-[120px]" />
      <Skeleton className="w-full h-[120px]" />
    </div>
  );
}

function PodcastResultCard({ result, onLinkClicked }: { result: SearchResult; onLinkClicked: () => void}) {
  return (
    <Link onClick={onLinkClicked} className="w-full" href={result.sourceUrl}>
      <div className="w-full h-[120px] overflow-y-hidden overflow-ellipsis p-4 flex flex-row gap-2 hover border border-slate-500 hover:border-primary">
        <div className="w-[100px]">
          {result.podcast!.imageUrl && <img src={result.podcast!.imageUrl} alt={`${result.podcast!.slug} logo`} />}
        </div>
        <div className="w-full flex flex-col gap-2">
          <div className="font-mono text-primary line-clamp-1">{result.podcast!.title}</div>
          <div className="text-muted-foreground font-mono text-xs line-clamp-3">{result.podcast!.description}</div>
        </div>
      </div>
    </Link>
  );
}

function EpisodeResultCard({ result, onLinkClicked }: { result: SearchResult; onLinkClicked: () => void}) {
  const imageUrl = result.episode?.imageUrl || result.podcast?.imageUrl;
  return (
    <Link onClick={onLinkClicked} className="w-full" href={result.sourceUrl}>
      <div className="w-full h-[150px] overflow-y-hidden overflow-ellipsis p-4 flex flex-row gap-2 hover border border-slate-500 hover:border-primary">
        <div className="w-[100px]">{imageUrl && <img src={imageUrl} alt="Episode image" />}</div>
        <div className="w-full flex flex-col gap-2">
          <div className="font-mono text-primary line-clamp-2">{result.episode!.title}</div>
          <div className="font-mono text-xs line-clamp-1">
            From <span className="text-primary">{result.podcast!.title}</span>
          </div>
          <div className="text-muted-foreground font-mono text-xs line-clamp-2">{result.episode!.description}</div>
        </div>
      </div>
    </Link>
  );
}
