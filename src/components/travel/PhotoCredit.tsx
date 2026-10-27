import type { Credit } from "@/lib/travel";

export function PhotoCredit({ c, className = "" }: { c: Credit; className?: string }) {
  return (
    <p className={`text-xs text-muted ${className}`} data-testid="photo-credit">
      Photo:{" "}
      <a href={c.source} className="underline" rel="noopener noreferrer" target="_blank">
        {c.author}
      </a>
      ,{" "}
      {c.licenceUrl ? (
        <a href={c.licenceUrl} className="underline" rel="license noopener noreferrer" target="_blank">
          {c.licence}
        </a>
      ) : (
        c.licence
      )}
      , via {c.provider}
    </p>
  );
}
