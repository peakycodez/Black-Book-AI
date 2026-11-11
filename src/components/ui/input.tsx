import * as React from "react"

import { cn } from "@/lib/utils"
import { forceCursorToStart } from "@/lib/textUtils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      forceCursorToStart(e.target);
      if (props.onFocus) {
        props.onFocus(e);
      }
    };

    return (
      <input
        type={type}
        dir="ltr"
        className={cn(
          "flex h-9 w-full rounded-xl border border-white/50 dark:border-white/15 bg-card/50 dark:bg-card/45 px-3 py-1 text-base backdrop-blur-md shadow-[inset_0_1px_2px_rgba(24,14,34,0.06)] transition-[border-color,box-shadow,background-color] duration-200 ease-tactile file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/75 hover:border-primary/45 focus-visible:outline-none focus-visible:border-primary/70 focus-visible:bg-card/75 focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.14),0_6px_18px_-6px_hsl(var(--primary)/0.2)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        style={{ direction: 'ltr', textAlign: 'left', unicodeBidi: 'plaintext' }}
        onFocus={handleFocus}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
