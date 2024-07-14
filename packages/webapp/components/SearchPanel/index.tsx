'use client';

import { useRef, useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { search } from '@/lib/actions';
import { SearchResult } from 'podverse-utils';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import Image from 'next/image';
import { useChatContext } from '@/components/ChatContext';
import { useSearchParams } from 'next/navigation';

export function SearchBox({
  showCancel,
  onCancel=()=>{},
  onLinkClicked=()=>{},
}: {
  showCancel: boolean;
  onCancel?: () => void;
  onLinkClicked?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const { podcast } = useChatContext();

  // For now, we don't allow search when we aren't in a podcast context.
  if (!podcast) {
    return null;
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const onSubmit = () => {
    setBusy(true);
    // For now, we always pass through podcast context to restrict search to the current podcast.
    // Removing this will allow for global search.
    search(query.trim(), podcast.slug)
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

  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit();
  };
  return (
    <div className="mx-auto flex max-h-screen w-full flex-col gap-4 rounded-md p-4 md:w-3/5">
      <div className="flex flex-row items-center gap-2">
        <form onSubmit={onFormSubmit} className="flex w-full flex-row gap-2">
          <Input
            defaultValue={query}
            onChange={onChange}
            ref={inputRef}
            type="text"
            placeholder={`Search ${podcast.title} episodes`}
            className="w-full"
          />
          <Button type="submit" disabled={query.trim() === ''} variant="default">
            Search
          </Button>
          {showCancel && (
            <Button onClick={() => onCancel()} variant="outline">
              Cancel
            </Button>
          )}
        </form>
      </div>
      <SearchResults results={results} error={error} busy={busy} onLinkClicked={() => onLinkClicked()} />
    </div>
  );
}

export function SearchPanel() {
  const [open, setOpen] = useState(false);
  const { podcast } = useChatContext();

  // For now, we don't allow search when we aren't in a podcast context.
  if (!podcast) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger>
        <div className="text-primary flex flex-row items-center gap-2 font-mono text-sm">
          <MagnifyingGlassIcon className="text-primary size-6" />
          <span className="hidden md:inline">Search</span>
        </div>
      </SheetTrigger>
      <SheetContent side="top">
        <SearchBox showCancel onCancel={() => setOpen(false)} onLinkClicked={() => setOpen(false)} />
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
    <div className="flex max-h-full w-full flex-col gap-4 overflow-y-scroll">
      {busy && <BusyState />}
      {error && <div className="font-mono text-sm text-red-500">{error.message}</div>}
      {podcastResults.length > 0 && !busy && <div className="font-mono">Podcasts</div>}
      {!busy &&
        podcastResults.map((result, index) => (
          <PodcastResultCard key={index} result={result} onLinkClicked={onLinkClicked} />
        ))}
      {episodeResults.length > 0 && !busy && <div className="font-mono">Episodes</div>}
      {!busy &&
        episodeResults.map((result, index) => (
          <EpisodeResultCard key={index} result={result} onLinkClicked={onLinkClicked} />
        ))}
    </div>
  );
}

function BusyState() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-[120px] w-full" />
      <Skeleton className="h-[120px] w-full" />
      <Skeleton className="h-[120px] w-full" />
    </div>
  );
}

function PodcastResultCard({ result, onLinkClicked }: { result: SearchResult; onLinkClicked: () => void }) {
  const searchParams = useSearchParams();
  const maybeSearchParams = searchParams.toString() ? `?${searchParams.toString()}` : '';

  return (
    <Link onClick={onLinkClicked} className="w-full" href={result.sourceUrl + maybeSearchParams}>
      <div className="hover hover:border-primary flex h-[120px] w-full flex-row gap-2 overflow-y-hidden text-ellipsis border border-slate-500 p-4">
        <div className="w-[100px]">
          {result.podcast!.imageUrl && (
            <Image src={result.podcast!.imageUrl} alt={`${result.podcast!.slug} logo`} width={100} height={100} />
          )}
        </div>
        <div className="flex w-full flex-col gap-2">
          <div className="text-primary line-clamp-1 font-mono">{result.podcast!.title}</div>
          <div className="text-muted-foreground line-clamp-3 font-mono text-xs">{result.podcast!.description}</div>
        </div>
      </div>
    </Link>
  );
}

function EpisodeResultCard({ result, onLinkClicked }: { result: SearchResult; onLinkClicked: () => void }) {
  const searchParams = useSearchParams();
  const maybeSearchParams = searchParams.toString() ? `?${searchParams.toString()}` : '';

  const imageUrl = result.episode?.imageUrl || result.podcast?.imageUrl;
  return (
    <Link target="_parent" onClick={onLinkClicked} className="w-full" href={result.sourceUrl + maybeSearchParams}>
      <div className="hover hover:border-primary flex h-[150px] w-full flex-row gap-2 overflow-y-hidden text-ellipsis border border-slate-500 p-4">
        <div className="w-[100px]">
          {imageUrl && <Image src={imageUrl} alt="Episode image" width={100} height={100} />}
        </div>
        <div className="flex w-full flex-col gap-2">
          <div className="text-primary line-clamp-2 font-mono">{result.episode!.title}</div>
          <div className="line-clamp-1 font-mono text-xs">
            From <span className="text-primary">{result.podcast!.title}</span>
          </div>
          <div className="text-muted-foreground line-clamp-2 font-mono text-xs">{result.episode!.description}</div>
        </div>
      </div>
    </Link>
  );
}
