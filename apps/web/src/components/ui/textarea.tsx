import * as React from "react";

import { cn } from "@/lib/utils";

// Aligné sur le token `field` de DESIGN.md, en version multi-ligne.
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[88px] w-full rounded-sm border border-input bg-card px-4 py-3 text-base text-foreground transition-colors placeholder:text-[var(--faint)] focus-visible:outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
