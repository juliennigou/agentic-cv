export const defaultAuthRedirect = "/compte";

export function getSafeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return defaultAuthRedirect;
  }

  return next;
}
