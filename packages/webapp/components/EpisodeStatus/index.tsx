'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { EpisodeWithPodcast, EpisodeStatus, EpisodeState, PodcastStat } from 'podverse-utils';
import { Column, ColumnDef, flexRender, getCoreRowModel, useReactTable, SortingState } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { durationString } from '@/lib/time';
import moment from 'moment';
import { EpisodeTooltip } from '../Indicators';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import { getEpisodes, getPodcastStats } from '@/lib/actions';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';

type EpisodeColumn = Column<EpisodeWithPodcast, unknown>;

/** A highlighted column header based on sorting. */
function columnHeader(title: string) {
  const func = ({ column }: { column: EpisodeColumn }) => {
    const variant = column.getIsSorted() !== false ? 'ghost' : 'ghost';
    const text = column.getIsSorted() !== false ? 'text-primary' : 'text-muted-foreground';
    return (
      <Button className={text} variant={variant} onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        {title}
        <ArrowsUpDownIcon className="ml-2 size-4" />
      </Button>
    );
  };
  return func;
}

const columns: ColumnDef<EpisodeWithPodcast>[] = [
  {
    accessorKey: 'imageUrl',
    header: 'Thumbnail',
    cell: ({ row, getValue }) => {
      const ep = row.original as EpisodeWithPodcast;
      const imageUrl = getValue() ?? ('' as string);
      return (
        <Link href={`/podcast/${ep.podcast.slug}/episode/${ep.slug}?uuid=${ep.podcast.uuid?.replace(/-/g, '')}`}>
          <div className="ring-primary flex h-[100px] flex-col overflow-y-clip border hover:ring-2">
            <div className="m-auto flex w-[100px]">
              {imageUrl && <Image src={getValue() as string} width={100} height={100} alt="Episode thumbnail" />}
            </div>
          </div>
        </Link>
      );
    },
  },
  {
    accessorKey: 'title',
    header: columnHeader('Title'),
    cell: ({ row, getValue }) => {
      const ep = row.original as EpisodeWithPodcast;
      return (
        <Link href={`/podcast/${ep.podcast.slug}/episode/${ep.slug}?uuid=${ep.podcast.uuid?.replace(/-/g, '')}`}>
          <span className="line-clamp-2 font-mono text-sm hover:underline">{getValue() as string}</span>
        </Link>
      );
    },
  },
  {
    accessorKey: 'podcast',
    header: columnHeader('Podcast'),
    accessorFn: (row) => row?.podcast.title,
    cell: ({ row, getValue }) => {
      const ep = row.original as EpisodeWithPodcast;
      return (
        <Link href={`/podcast/${ep.podcast.slug}?uuid=${ep.podcast.uuid?.replace(/-/g, '')}`}>
          <span className="text-primary line-clamp-2 font-mono text-sm hover:underline">{getValue() as string}</span>
        </Link>
      );
    },
  },
  {
    accessorKey: 'pubDate',
    header: columnHeader('Published'),
    cell: ({ getValue }) => {
      return (
        <span className="text-muted-foreground line-clamp-2 w-[130px] text-sm">
          {moment(getValue() as string).format('D MMM YYYY')}
        </span>
      );
    },
  },
  {
    accessorKey: 'duration',
    header: columnHeader('Duration'),
    cell: ({ getValue }) => {
      return <span className="text-muted-foreground line-clamp-2 text-sm">{durationString(getValue() as number)}</span>;
    },
  },
  {
    accessorKey: 'state',
    header: 'Status',
    cell: ({ row }) => {
      return <EpisodeTooltip episode={row.original as EpisodeWithPodcast} iconOnly />;
    },
  },
  {
    accessorKey: 'status->>startedAt',
    header: columnHeader('Started'),
    accessorFn: (row) => (row?.status as EpisodeStatus)?.startedAt,
    cell: ({ row }) => {
      const episode = row.original as EpisodeWithPodcast;
      const status = episode.status as EpisodeStatus;
      return (
        <span className="text-muted-foreground line-clamp-2 w-[130px] text-sm">
          {status ? moment(status.startedAt as string).format('D MMM YYYY') : 'never'}
        </span>
      );
    },
  },
  {
    accessorKey: 'status->>completedAt',
    header: columnHeader('Completed'),
    accessorFn: (row) => (row?.status as EpisodeStatus)?.completedAt,
    cell: ({ row }) => {
      const episode = row.original as EpisodeWithPodcast;
      const status = episode.status as EpisodeStatus;
      return (
        <span className="text-muted-foreground line-clamp-2 w-[130px] text-sm">
          {status ? moment(status.completedAt as string).format('D MMM YYYY') : 'never'}
        </span>
      );
    },
  },
];

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

function PodcastSelector({
  podcasts,
  value,
  onValueChange,
}: {
  podcasts: PodcastStat[];
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => (v === 'all' ? onValueChange?.('') : onValueChange?.(v))}>
      <SelectTrigger className="w-[180px] text-xs">
        <SelectValue placeholder="Podcast" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={'all'} className="w-[400px] overflow-hidden truncate">
          All podcasts
        </SelectItem>
        {podcasts.map((podcast) => (
          <SelectItem key={podcast.id} value={podcast.id.toString()} className="w-[400px] overflow-hidden truncate">
            {podcast.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function EpisodeTable<TData, TValue>() {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EpisodeWithPodcast[]>([]);
  const [page, setPage] = useState(1);
  const [rowCount, setRowCount] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [showReady, setShowReady] = useState(true);
  const [showPending, setShowPending] = useState(true);
  const [showProcessing, setShowProcessing] = useState(true);
  const [showError, setShowError] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [podcasts, setPodcasts] = useState<PodcastStat[]>([]);
  const [podcastId, setPodcastId] = useState<number | undefined>(undefined);

  const ENTRIES_PER_PAGE = 10;
  const numPages = Math.ceil(rowCount / ENTRIES_PER_PAGE);

  const previousPage = () => {
    if (page > 1) {
      setPage(page - 1);
      table.previousPage();
    }
  };
  const nextPage = () => {
    if (page < numPages) {
      setPage(page + 1);
      table.nextPage();
    }
  };
  const gotoPage = (value: number) => {
    setPage(value);
  };

  // Called when state filter changes.
  const changeStateFilter = (filter: EpisodeState[]) => {
    setShowReady(filter.includes('ready'));
    setShowPending(filter.includes('pending'));
    setShowProcessing(filter.includes('processing'));
    setShowError(filter.includes('error'));
  };

  // Memoize state filter for the ToggleGroup component.
  const stateFilter = useMemo(() => {
    const filter: EpisodeState[] = [];
    if (showReady) {
      filter.push('ready');
    }
    if (showPending) {
      filter.push('pending');
    }
    if (showProcessing) {
      filter.push('processing');
    }
    if (showError) {
      filter.push('error');
    }
    return filter;
  }, [showReady, showPending, showProcessing, showError]);

  // Either show real or fake data depending on loading state.
  const loadingData = useMemo(() => (loading ? Array(10).fill({}) : data), [loading, data]);

  // Either show fake or real columns depending on loading state.
  const columnsLoading = useMemo(
    () =>
      loading
        ? columns.map((column) => ({
            ...column,
            cell: () => <Skeleton className="h-4 w-full" />,
          }))
        : columns,
    [loading],
  );

  // The table component itself.
  const table = useReactTable({
    data: loadingData,
    columns: columnsLoading,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    onSortingChange: setSorting,
    rowCount,
    state: {
      sorting,
    },
  });

  // Fetch list of podcasts.
  useEffect(() => {
    getPodcastStats().then((stats) => {
      setPodcasts(stats.filter((stat) => stat.owner === userId));
    });
  }, [userId]);

  // Reset page count to 1 when sorting changes.
  useEffect(() => {
    setPage(1);
  }, [sorting]);

  // Fetch data.
  useEffect(() => {
    if (!userId) {
      return;
    }
    let sortBy: string | undefined = undefined;
    let ascending: boolean | undefined = undefined;
    if (sorting && sorting.length > 0) {
      sortBy = sorting[0].id;
      ascending = !sorting[0].desc;
    }
    setLoading(true);
    getEpisodes({
      owner: userId,
      podcastId,
      sortBy,
      ascending,
      offset: (page - 1) * ENTRIES_PER_PAGE,
      limit: 10,
      ready: stateFilter.includes('ready'),
      pending: stateFilter.includes('pending'),
      processing: stateFilter.includes('processing'),
      error: stateFilter.includes('error'),
      searchTerm,
    }).then(([episodes, count]) => {
      setData(episodes);
      setRowCount(count);
      setLoading(false);
    });
  }, [userId, page, sorting, stateFilter, searchTerm, podcastId]);

  return (
    <div>
      <div className="flex flex-row items-center justify-between">
        {loading && rowCount === 0 ? (
          <Skeleton className="my-2 h-8 w-full" />
        ) : (
          <>
            <span className="text-primary font-mono text-sm">{rowCount} episodes</span>
            <div>
              <Pagination>
                <PaginationContent className="text-xs">
                  <PaginationItem>
                    <PaginationPrevious isActive onClick={previousPage} />
                  </PaginationItem>
                  {page > 1 && (
                    <PaginationItem>
                      <PaginationLink key={1} onClick={() => gotoPage(1)}>
                        1
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  {page > 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink key={page} className="text-primary" onClick={() => gotoPage(page)}>
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                  {page < numPages - 1 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  {page < numPages && (
                    <PaginationItem>
                      <PaginationLink key={numPages} onClick={() => gotoPage(numPages)}>
                        {numPages}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationNext isActive onClick={nextPage} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </>
        )}
      </div>
      <div className="mt-4 flex flex-row items-center justify-between">
        <div className="mb-2 flex flex-row items-center gap-2">
          <Input
            placeholder="Filter episodes"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="max-w-sm"
          />
          <PodcastSelector
            podcasts={podcasts}
            value={podcastId ? podcastId.toString() : ''}
            onValueChange={(v) => setPodcastId(v ? parseInt(v) : undefined)}
          />
        </div>

        <div className="mb-2 flex flex-row items-center gap-2">
          <ToggleGroup
            size="sm"
            variant="outline"
            type="multiple"
            value={stateFilter}
            onValueChange={(val) => changeStateFilter(val as EpisodeState[])}
          >
            <ToggleGroupItem value="ready">ready</ToggleGroupItem>
            <ToggleGroupItem value="pending">pending</ToggleGroupItem>
            <ToggleGroupItem value="processing">processing</ToggleGroupItem>
            <ToggleGroupItem value="error">error</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
