'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export function Collapse({ children, open = false, ...props }: { children: React.ReactNode; open: boolean }) {
  return (
    <div
      className={
        open
          ? 'line-clamp-none transition-all duration-300 ease-in-out'
          : 'line-clamp-4 transition-all duration-300 ease-in-out'
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
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.offsetHeight);
    }
  }, [children]);

  return (
    <div className="flex flex-col gap-2">
      <div ref={contentRef}>
        <Collapse open={open}>{children}</Collapse>
      </div>
      <div className="flex flex-row gap-2">
        <>{extra}</>
        {contentHeight > 60 && (
          <Button className="text-primary ml-auto text-sm" variant="outline" onClick={() => setOpen(!open)}>
            {open ? 'Hide' : 'Show more'}
          </Button>
        )}
      </div>
    </div>
  );
}
