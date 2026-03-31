import Link from "next/link";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  extraParams?: Record<string, string>;
}

function buildHref(basePath: string, page: number, extraParams?: Record<string, string>) {
  const params = new URLSearchParams(extraParams);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export default function Pagination({ currentPage, totalPages, basePath, extraParams }: PaginationProps) {
  // Show at most 7 page buttons: first, last, current ±2, and ellipsis
  const pages: (number | "...")[] = [];
  const delta = 2;
  const left = currentPage - delta;
  const right = currentPage + delta;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= left && i <= right)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  const btnBase = "inline-flex items-center justify-center min-w-9 h-9 px-2.5 rounded-md text-sm font-medium border border-border text-text-secondary bg-bg-card transition-all no-underline";
  const btnActive = "inline-flex items-center justify-center min-w-9 h-9 px-2.5 rounded-md text-sm font-bold border border-accent text-white bg-accent no-underline";
  const btnDisabled = "inline-flex items-center justify-center min-w-9 h-9 px-2.5 rounded-md text-sm font-medium border border-border text-text-secondary bg-bg-card opacity-30 pointer-events-none";

  return (
    <nav
      aria-label="分页"
      className="flex items-center justify-center gap-1.5 pt-8 pb-4 flex-wrap"
    >
      {/* Prev */}
      {currentPage <= 1 ? (
        <span className={btnDisabled}>
          <CaretLeft size={14} weight="bold" />
        </span>
      ) : (
        <Link href={buildHref(basePath, currentPage - 1, extraParams)} className={btnBase}>
          <CaretLeft size={14} weight="bold" />
        </Link>
      )}

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="inline-flex items-center justify-center min-w-9 h-9 px-2.5 text-sm font-medium text-text-secondary pointer-events-none">
            …
          </span>
        ) : (
          <Link key={p} href={buildHref(basePath, p, extraParams)} className={p === currentPage ? btnActive : btnBase}>
            {p}
          </Link>
        )
      )}

      {/* Next */}
      {currentPage >= totalPages ? (
        <span className={btnDisabled}>
          <CaretRight size={14} weight="bold" />
        </span>
      ) : (
        <Link href={buildHref(basePath, currentPage + 1, extraParams)} className={btnBase}>
          <CaretRight size={14} weight="bold" />
        </Link>
      )}
    </nav>
  );
}
