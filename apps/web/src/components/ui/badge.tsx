import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Token `tag` de DESIGN.md : mono 12px/500, rounded sm, padding 4px 8px.
const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-1 font-mono text-xs font-medium leading-none tracking-[0.02em]",
  {
    variants: {
      variant: {
        default: "border-border bg-secondary text-muted-foreground",
        accent: "border-[var(--accent-soft)] bg-[var(--accent-soft)] text-[var(--accent)]"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
