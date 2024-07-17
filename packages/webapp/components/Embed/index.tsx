'use client';

import { useState } from 'react';
import { PodcastWithEpisodes, EpisodeWithPodcast } from 'podverse-utils';
import { CompactPicker } from 'react-color';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

type PodcastEmbedType = 'episodeList' | 'podcastChat' | 'episodeSearch';
type EpisodeEmbedType = 'episodeSummary' | 'episodeTranscript' | 'episodeChat';
type EmbedType = PodcastEmbedType | EpisodeEmbedType;

function EmbedControls({
  podcast,
  embedType,
  bgColor,
  fgColor,
  highlightColor,
  theme,
  width,
  height,
  setEmbedType,
  setBgColor,
  setFgColor,
  setHighlightColor,
  setTheme,
  setWidth,
  setHeight,
}: {
  podcast?: boolean;
  embedType: EmbedType;
  bgColor: string;
  fgColor: string;
  highlightColor: string;
  theme: string;
  width: number;
  height: number;
  setEmbedType: (embedType: EmbedType) => void;
  setBgColor: (color: string) => void;
  setFgColor: (color: string) => void;
  setHighlightColor: (color: string) => void;
  setTheme: (theme: string) => void;
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
}) {
  const [tempWidth, setTempWidth] = useState<string | null>(width.toString());
  const [tempHeight, setTempHeight] = useState<string | null>(height.toString());

  const onThemeChange = (theme: string) => {
    setTheme(theme);
    setFgColor(theme === 'dark' ? '#ffffff' : '#000000');
    setBgColor(theme === 'dark' ? '#000000' : '#ffffff');
    //setHighlightColor('#f59e0b');
  };

  const onWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!parseInt(e.target.value)) {
      setTempWidth(null);
    } else {
      setTempWidth(e.target.value);
    }
  };

  const onHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!parseInt(e.target.value)) {
      setTempHeight(null);
    } else {
      setTempHeight(e.target.value);
    }
  };

  const resizeClicked = () => {
    setWidth(parseInt(tempWidth || '400'));
    setHeight(parseInt(tempHeight || '600'));
  };

  return (
    <div className="flex w-[250px] flex-col gap-2">
      <div className="font-mono text-sm">Embed type</div>
      <Select value={embedType} onValueChange={setEmbedType}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select embed type" />
        </SelectTrigger>
        <SelectContent>
          {podcast ? (
            <>
              <SelectItem value="episodeList">Episode list</SelectItem>
              <SelectItem value="episodeSearch">Episode search</SelectItem>
              <SelectItem value="podcastChat">AI chat</SelectItem>
            </>
          ) : (
            <>
              <SelectItem value="episodeTranscript">Transcript</SelectItem>
              <SelectItem value="episodeSummary">Episode summary</SelectItem>
              <SelectItem value="episodeChat">AI chat</SelectItem>
            </>
          )}
        </SelectContent>
      </Select>
      <div className="font-mono text-sm">Theme</div>
      <Select value={theme} onValueChange={onThemeChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select theme" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">Light</SelectItem>
          <SelectItem value="dark">Dark</SelectItem>
          <SelectItem value="system">System</SelectItem>
        </SelectContent>
      </Select>
      <div className="mt-4 font-mono text-sm">Background color</div>
      <CompactPicker color={bgColor} onChangeComplete={(color) => setBgColor(color.hex)} />
      <div className="mt-4 font-mono text-sm">Foreground color</div>
      <CompactPicker color={fgColor} onChangeComplete={(color) => setFgColor(color.hex)} />
      <div className="mt-4 font-mono text-sm">Highlight color</div>
      <CompactPicker color={highlightColor} onChangeComplete={(color) => setHighlightColor(color.hex)} />
      <div className="mt-4 font-mono text-sm">Size</div>
      <div className="mt-0 flex flex-row items-center gap-1 font-mono text-base">
        <Input className="w-[80px]" type="text" placeholder="Width" value={tempWidth || ''} onChange={onWidthChange} />{' '}
        x{' '}
        <Input
          className="w-[80px]"
          type="text"
          placeholder="Height"
          value={tempHeight || ''}
          onChange={onHeightChange}
        />
        <Button onClick={resizeClicked} disabled={tempWidth === null || tempHeight === null} className="font-mono">
          Resize
        </Button>
      </div>
    </div>
  );
}

function CopyToClipboard({ text }: { text: string }) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    toast.success('Embed code copied to clipboard');
  };
  return (
    <div
      className="bg-muted flex cursor-pointer flex-row items-center gap-1 rounded-full p-2"
      onClick={copyToClipboard}
    >
      <ClipboardDocumentListIcon className="text-primary size-4" />
    </div>
  );
}

function EmbedPreview({
  podcastSlug,
  episodeSlug,
  embedType,
  bgColor,
  fgColor,
  highlightColor,
  theme,
  width,
  height,
}: {
  podcastSlug: string;
  episodeSlug?: string;
  embedType?: EmbedType;
  bgColor?: string;
  fgColor?: string;
  highlightColor?: string;
  theme?: string;
  width: number;
  height: number;
}) {
  const searchParams = {
    bgColor: bgColor || '',
    fgColor: fgColor || '',
    highlightColor: highlightColor || '',
    theme: theme || '',
  };
  const params = new URLSearchParams([...Object.entries(searchParams).filter(([_, v]) => v !== '')]).toString();
  let url = '';
  if (embedType === 'episodeList') {
    url = `/embed/podcast/${podcastSlug}${params ? '?' + params : ''}`;
  } else if (embedType === 'episodeSearch') {
    url = `/embed/podcast/${podcastSlug}/search${params ? '?' + params : ''}`;
  } else if (embedType === 'podcastChat') {
    url = `/embed/podcast/${podcastSlug}/chat${params ? '?' + params : ''}`;
  } else if (embedType === 'episodeSummary') {
    url = `/embed/podcast/${podcastSlug}/episode/${episodeSlug}/summary${params ? '?' + params : ''}`;
  } else if (embedType === 'episodeTranscript') {
    url = `/embed/podcast/${podcastSlug}/episode/${episodeSlug}/transcript${params ? '?' + params : ''}`;
  } else if (embedType === 'episodeChat') {
    url = `/embed/podcast/${podcastSlug}/episode/${episodeSlug}/chat${params ? '?' + params : ''}`;
  } else {
    return <div className="flex flex-col gap-4">{'Invalid embed type ' + embedType}</div>;
  }
  return (
    <div className="flex flex-col gap-4">
      <EmbedCode url={url} width={width} height={height} />
      <div>Preview</div>
      <iframe src={url} width={width} height={height} className={`border-muted-foreground border`} />
    </div>
  );
}

function EmbedCode({ url, width, height }: { url: string; width: number; height: number }) {
  const embedCode = `<iframe src="https://www.podverse.ai${url}" width="${width}" height="${height}"></iframe>`;

  return (
    <>
      <div className="flex flex-row items-center gap-2">
        <div>Embed code</div>
        <CopyToClipboard text={embedCode} />
      </div>
      <div className="text-sm text-muted-foreground">Copy and paste the code below into your website</div>
      <div className="border-primary w-[400px] overflow-scroll rounded-lg border p-2 font-mono text-xs">
        {embedCode}
      </div>
    </>
  );
}


export function EmbedPodcast({ podcast }: { podcast: PodcastWithEpisodes }) {
  const [embedType, setEmbedType] = useState<EmbedType>('episodeList');
  const [bgColor, setBgColor] = useState('#000000');
  const [fgColor, setFgColor] = useState('#f0f0f0');
  const [highlightColor, setHighlightColor] = useState('#f59e0b');
  const [theme, setTheme] = useState('dark');
  const [width, setWidth] = useState(400);
  const [height, setHeight] = useState(600);

  if (podcast.private) {
    return (
      <div className="font-mono">
        This podcast is private. In order to embed its content on another site, you must set the podcast link to public
        on the General settings tab.
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-8">
      <EmbedControls
        podcast
        embedType={embedType}
        bgColor={bgColor}
        fgColor={fgColor}
        highlightColor={highlightColor}
        theme={theme}
        width={width}
        height={height}
        setEmbedType={setEmbedType}
        setBgColor={setBgColor}
        setFgColor={setFgColor}
        setHighlightColor={setHighlightColor}
        setTheme={setTheme}
        setWidth={setWidth}
        setHeight={setHeight}
      />
      <EmbedPreview
        embedType={embedType}
        podcastSlug={podcast.slug}
        bgColor={bgColor}
        fgColor={fgColor}
        highlightColor={highlightColor}
        theme={theme}
        width={width}
        height={height}
      />
    </div>
  );
}


export function EmbedEpisode({ episode }: { episode: EpisodeWithPodcast }) {
  const [embedType, setEmbedType] = useState<EmbedType>('episodeTranscript');
  const [bgColor, setBgColor] = useState('#000000');
  const [fgColor, setFgColor] = useState('#f0f0f0');
  const [highlightColor, setHighlightColor] = useState('#f59e0b');
  const [theme, setTheme] = useState('dark');
  const [width, setWidth] = useState(400);
  const [height, setHeight] = useState(600);

  if (episode.podcast.private) {
    return (
      <div className="font-mono">
        This podcast is private. In order to embed its content on another site, you must set the podcast link to public
        on the Podcast&ldquo;s General settings tab.
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-8">
      <EmbedControls
        embedType={embedType}
        bgColor={bgColor}
        fgColor={fgColor}
        highlightColor={highlightColor}
        theme={theme}
        width={width}
        height={height}
        setEmbedType={setEmbedType}
        setBgColor={setBgColor}
        setFgColor={setFgColor}
        setHighlightColor={setHighlightColor}
        setTheme={setTheme}
        setWidth={setWidth}
        setHeight={setHeight}
      />
      <EmbedPreview
        embedType={embedType}
        podcastSlug={episode.podcast.slug}
        episodeSlug={episode.slug}
        bgColor={bgColor}
        fgColor={fgColor}
        highlightColor={highlightColor}
        theme={theme}
        width={width}
        height={height}
      />
    </div>
  );
}