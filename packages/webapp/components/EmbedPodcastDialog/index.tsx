'use client';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Markdown from 'react-markdown';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import xml from 'react-syntax-highlighter/dist/esm/languages/hljs/xml';
import gruvboxDark from 'react-syntax-highlighter/dist/esm/styles/hljs/gruvbox-dark';

const codeStyle = gruvboxDark;

SyntaxHighlighter.registerLanguage('javascript', js);
SyntaxHighlighter.registerLanguage('xml', xml);

export function EmbedPodcastDialog({ podcastSlug, episodeSlug }: { podcastSlug: string; episodeSlug?: string }) {
  const headCode = `<head>
    <script src="https://www.podverse.ai/js/embed.js"></script>
</head>`;
  const divCode = `<div id="podverse-chat-container"></div>`;
  const scriptCode = `<script>
    embedPodverseChat('podverse-chat-container', {
        podcast: '${podcastSlug}',
        ${episodeSlug ? "episode: '" + episodeSlug + "',\n" : ''}
        // Width and height can be optionally specified.
        width: '800px',
        height: '600px'
    });
</script>`;

  return (
    <Dialog>
      <DialogTrigger>
        <div className={cn(buttonVariants({ variant: 'outline' }))}>
          Embed {episodeSlug ? 'episode' : 'podcast'} chat
        </div>
      </DialogTrigger>
      <DialogContent className="w-full max-w-xl overflow-x-auto md:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-mono">Embed {episodeSlug ? 'Episode' : 'Podcast'} chat</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 text-sm">
          <div>
            Use the code below to embed the Podverse Chat widget for this {episodeSlug ? 'episode' : 'podcast'} on your
            website.
          </div>
          <div>
            First, add the following code to the <span className="text-primary font-mono">&lt;head&gt;</span> of your
            page:
          </div>
          <div className="border-primary mx-8 rounded-lg border p-4">
            <SyntaxHighlighter language="xml" style={codeStyle}>
              {headCode}
            </SyntaxHighlighter>
          </div>
          <div>
            Next, add a <span className="text-primary font-mono">&lt;div&gt;</span> to your page where you would like
            the Podverse chat widget to appear:
          </div>
          <div className="border-primary mx-8 rounded-lg border p-4">
            <SyntaxHighlighter language="xml" style={codeStyle}>
              {divCode}
            </SyntaxHighlighter>
          </div>
          <div>Finally, add the following code to your page to initialize the Podverse chat widget:</div>
          <div className="border-primary mx-8 rounded-lg border p-4">
            <SyntaxHighlighter language="xml" style={codeStyle}>
              {scriptCode}
            </SyntaxHighlighter>
          </div>
        </div>
        <DialogFooter>
          <DialogClose>
            <Button className="font-mono" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
