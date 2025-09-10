
"use client";

import * as React from 'react';
import { cn } from '@/lib/utils';

const AutoSizingTextarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null);
    const combinedRef = (node: HTMLTextAreaElement) => {
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
        (internalRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
    };

    const adjustHeight = () => {
        const textarea = internalRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    };

    React.useEffect(() => {
        adjustHeight();
    }, [props.value]);

    React.useLayoutEffect(() => {
        adjustHeight();
    }, []);

    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full resize-none overflow-hidden rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className
        )}
        ref={combinedRef}
        onInput={adjustHeight}
        {...props}
      />
    );
  }
);
AutoSizingTextarea.displayName = 'AutoSizingTextarea';

export { AutoSizingTextarea };
