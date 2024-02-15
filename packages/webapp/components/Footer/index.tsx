import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer>
      <div className="w-full border-t mt-16">
      <div className="mx-auto mt-4 mb-8 flex w-3/5 flex-row items-center gap-2 justify-between px-4 py-2 text-center text-sm">
        <div className="flex flex-row gap-2 items-center">
          <Link className="flex flex-row gap-2" href="https://ziggylabs.ai/">
            <div className="text-muted-foreground">Made with 🦴 by</div>
            <div className="text-primary">Ziggylabs.ai</div>
          </Link>
        </div>
        <div className="text-primary">
          <Link href="mailto:hello@ziggylabs.ai">Contact us</Link>
        </div>
        <div className="text-primary">
          <Link href="/privacy">Privacy policy</Link>
        </div>
      </div>
      </div>
    </footer>
  );
}
