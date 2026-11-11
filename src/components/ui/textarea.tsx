import * as React from "react"

import { cn } from "@/lib/utils"
import { forceCursorToStart } from "@/lib/textUtils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    forceCursorToStart(e.target);
    if (props.onFocus) {
      props.onFocus(e);
    }
  };

  return (
    <textarea
      dir="ltr"
      className={cn(
        "flex min-h-[60px] w-full rounded-xl border border-white/50 dark:border-white/15 bg-card/50 dark:bg-card/45 px-3 py-2 text-base backdrop-blur-md shadow-[inset_0_1px_2px_rgba(24,14,34,0.06)] placeholder:text-muted-foreground/75 transition-[border-color,box-shadow,background-color] duration-200 ease-tactile hover:border-primary/45 focus-visible:outline-none focus-visible:border-primary/70 focus-visible:bg-card/75 focus-visible:ring-2 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      style={{ direction: 'ltr', textAlign: 'left', unicodeBidi: 'plaintext' }}
      onFocus={handleFocus}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
