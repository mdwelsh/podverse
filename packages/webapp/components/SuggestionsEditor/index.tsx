'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getPodcastSuggestions } from '@/lib/actions';
import { Input } from '@/components/ui/input';
import { TrashIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

function Suggestion({
  suggestion,
  onChange,
  onDelete,
}: {
  suggestion?: string;
  onChange: (suggestion: string) => void;
  onDelete?: () => void;
}) {
  const [value, setValue] = useState(suggestion);

  return (
    <div className="flex flex-row gap-2 items-center">
      <Input
        className="w-[400px]"
        value={value}
        placeholder="e.g., Who are the hosts of this podcast?"
        onChange={(e) => setValue(e.target.value)}
      />
      {!suggestion ? (
        <Button variant="default" disabled={!value} onClick={(e) => onChange(value!)}>
          Add
        </Button>
      ) : (
        <>
          <Button variant="default" disabled={!value || value === suggestion} onClick={(e) => onChange(value!)}>
            Edit
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            <TrashIcon className="size-4" />
          </Button>
        </>
      )}
    </div>
  );
}

export function SuggestionsEditor({ podcastId }: { podcastId: number }) {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (suggestions.length > 0) {
      return;
    }
    getPodcastSuggestions(podcastId, false)
      .then((suggestions) => {
        setSuggestions(suggestions);
      })
      .catch((e) => {
        toast.error('Failed to fetch podcast: ' + e.message);
      });
  }, [podcastId, suggestions]);

  return (
    <div className="flex flex-col items-start gap-8">
      {!suggestions.length ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <div className="text-muted-foreground text-sm mb-4">
              Below you can edit suggested questions that appear in the chat widget for this podcast. If no suggestions
              are provided, the chat widget will show a set of suggestions automatically generated from the content of
              podcast episodes.
            </div>
            {/* XXX MDW: This is not quite done yet.  */}
            {/* <Suggestion />
            {suggestions.map((suggestion, index) => (
              <Suggestion key={index} suggestion={suggestion} />
            ))} */}
          </div>
        </>
      )}
    </div>
  );
}
