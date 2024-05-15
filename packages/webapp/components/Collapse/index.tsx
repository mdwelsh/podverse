'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export function Collapse({ children, open = false, ...props }: { children: React.ReactNode; open: boolean }) {
  return (
    <div
      className={
        open
          ? 'line-clamp-none transition-all duration-300 ease-in-out'
          : 'line-clamp-4 transition-all duration-300 ease-in-out sm:line-clamp-6'
      }
      {...props}
    >
      {children}
    </div>
  );
}

export function CollapseWithToggle({ children, extra }: { children: React.ReactNode; extra?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.offsetHeight);
    }
  }, [children]);

  return (
    <div className="flex flex-col gap-0">
      <div ref={contentRef}>
        <Collapse open={open}>{children}</Collapse>
      </div>
      <div className="flex flex-row gap-2">
        {contentHeight > 60 && (
          <Button className="text-primary ml-auto text-sm" variant="ghost" onClick={() => setOpen(!open)}>
            {open ? 'Hide' : 'Show more'}
          </Button>
        )}
      </div>
    </div>
  );
}
