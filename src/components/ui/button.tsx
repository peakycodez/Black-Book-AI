import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-150 ease-tactile focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:transform-none disabled:shadow-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-200 active:scale-[0.978]",
  {
    variants: {
      variant: {
        default:
          "botanical-primary-sheen border border-white/25 dark:border-white/15 bg-primary text-primary-foreground shadow-sm hover:-translate-y-px hover:brightness-[1.04] active:translate-y-px",
        destructive:
          "border border-white/20 bg-destructive text-destructive-foreground shadow-xs hover:-translate-y-px hover:bg-destructive/92 hover:shadow-md active:translate-y-px",
        outline:
          "border border-white/45 dark:border-white/15 bg-card/45 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_2px_10px_-4px_rgba(64,34,54,0.12)] hover:bg-card/65 hover:border-primary/45 hover:shadow-botanical active:translate-y-px",
        secondary:
          "border border-white/35 dark:border-white/12 bg-secondary/75 text-secondary-foreground backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] hover:bg-secondary/90 hover:border-primary/35 hover:shadow-sm active:translate-y-px",
        ghost:
          "hover:bg-primary/[0.10] hover:text-primary active:bg-primary/[0.15]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-10 rounded-xl px-7",
        icon: "h-9 w-9 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
