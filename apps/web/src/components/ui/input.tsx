import * as React from "react";

import { cn } from "@/lib/utils";

// Aligné sur le token `field` de DESIGN.md : 44px, surface, hairline, rounded sm.
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-sm border border-input bg-card px-4 text-base text-foreground transition-colors placeholder:text-[var(--faint)] focus-visible:outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
