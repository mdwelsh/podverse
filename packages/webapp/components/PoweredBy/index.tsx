import Link from 'next/link';

export function PoweredBy({ link }: { link?: string }) {
  const defaultLink = 'https://podverse.ai';
  return (
    <div className="text-muted-foreground mx-auto text-sm">
      Powered by{' '}
      <Link target="_parent" className="underline" href={link || defaultLink}>
        Podverse
      </Link>
    </div>
  );
}
