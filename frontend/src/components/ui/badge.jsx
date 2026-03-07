import * as React from "react"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-mono",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/10 text-primary border-primary/30",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-red-500/30 bg-red-500/10 text-red-500",
        success:
          "border-accent/30 bg-accent/10 text-accent",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}) {
  return (<div className={cn(badgeVariants({ variant }), className)} {...props} />);
}

export { Badge, badgeVariants }
