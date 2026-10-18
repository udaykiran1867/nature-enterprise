import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

function windowOf(page: number, pages: number): (number | "…")[] {
  const keep = new Set([1, pages, page - 1, page, page + 1]);
  if (page <= 3) { keep.add(2); keep.add(3); }
  if (page >= pages - 2) { keep.add(pages - 1); keep.add(pages - 2); }
  const nums = [...keep].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  nums.forEach((n, i) => { if (i && n - nums[i - 1] > 1) out.push("…"); out.push(n); });
  return out;
}

type Props = { page: number; pages: number; total: number; pageSize: number; noun?: string; hrefFor: (page: number) => string };

export function Pagination({ page, pages, total, pageSize, noun = "items", hrefFor }: Props) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="mt-6 flex flex-col items-end gap-2">
      {pages > 1 && (
        <nav aria-label="Pagination" className="flex flex-wrap items-center justify-end gap-1">
          {page > 1 ? (
            <Link href={hrefFor(page - 1)} className="inline-flex h-8 items-center gap-1 rounded-full border border-border bg-card px-3 text-xs font-medium text-forest-dark transition-colors hover:border-forest hover:bg-secondary" aria-label="Previous page"><ChevronLeft className="size-3.5" aria-hidden /> Prev</Link>
          ) : <span className="inline-flex h-8 items-center gap-1 rounded-full border border-border bg-card px-3 text-xs font-medium text-forest-dark opacity-40 pointer-events-none" aria-disabled="true"><ChevronLeft className="size-3.5" aria-hidden /> Prev</span>}
          {windowOf(page, pages).map((n, i) =>
            n === "…" ? <span key={`gap${i}`} className="px-1 text-xs text-muted-foreground" aria-hidden>…</span> : (
              <Link key={n} href={hrefFor(n)} aria-label={`Page ${n}`} aria-current={n === page ? "page" : undefined}
                className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full border px-2.5 text-xs font-medium transition-colors ${n === page ? "border-forest bg-forest text-ivory hover:bg-forest-dark" : "border-border bg-card text-forest-dark hover:border-forest hover:bg-secondary"}`}>{n}</Link>
            ))}
          {page < pages ? (
            <Link href={hrefFor(page + 1)} className="inline-flex h-8 items-center gap-1 rounded-full border border-border bg-card px-3 text-xs font-medium text-forest-dark transition-colors hover:border-forest hover:bg-secondary" aria-label="Next page">Next <ChevronRight className="size-3.5" aria-hidden /></Link>
          ) : <span className="inline-flex h-8 items-center gap-1 rounded-full border border-border bg-card px-3 text-xs font-medium text-forest-dark opacity-40 pointer-events-none" aria-disabled="true">Next <ChevronRight className="size-3.5" aria-hidden /></span>}
        </nav>
      )}
      <p className="text-xs text-muted-foreground">Showing {from}–{to} of {total} {noun}</p>
    </div>
  );
}
