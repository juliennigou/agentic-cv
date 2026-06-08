import { cn } from "@/lib/utils";

// Petit label mono « œillet » avec pastille accent, repris sur plusieurs pages.
export function Eyebrow({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground",
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-[var(--accent)]" aria-hidden />
      {children}
    </span>
  );
}
