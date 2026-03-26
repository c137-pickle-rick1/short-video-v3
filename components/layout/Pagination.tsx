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

  const btnBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "36px",
    height: "36px",
    padding: "0 10px",
    borderRadius: "6px",
    fontSize: "0.875rem",
    fontWeight: 500,
    border: "1px solid var(--border)",
    color: "var(--text-secondary)",
    background: "var(--bg-card)",
    transition: "all 0.15s",
    textDecoration: "none",
  };

  const btnActive: React.CSSProperties = {
    ...btnBase,
    background: "var(--accent)",
    borderColor: "var(--accent)",
    color: "#fff",
    fontWeight: 700,
  };

  const btnDisabled: React.CSSProperties = {
    ...btnBase,
    opacity: 0.3,
    pointerEvents: "none",
  };

  return (
    <nav
      aria-label="分页"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        padding: "2rem 0 1rem",
        flexWrap: "wrap",
      }}
    >
      {/* Prev */}
      {currentPage <= 1 ? (
        <span style={btnDisabled}>
          <CaretLeft size={14} weight="bold" />
        </span>
      ) : (
        <Link href={buildHref(basePath, currentPage - 1, extraParams)} style={btnBase}>
          <CaretLeft size={14} weight="bold" />
        </Link>
      )}

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} style={{ ...btnBase, border: "none", background: "transparent", pointerEvents: "none" }}>
            …
          </span>
        ) : (
          <Link key={p} href={buildHref(basePath, p, extraParams)} style={p === currentPage ? btnActive : btnBase}>
            {p}
          </Link>
        )
      )}

      {/* Next */}
      {currentPage >= totalPages ? (
        <span style={btnDisabled}>
          <CaretRight size={14} weight="bold" />
        </span>
      ) : (
        <Link href={buildHref(basePath, currentPage + 1, extraParams)} style={btnBase}>
          <CaretRight size={14} weight="bold" />
        </Link>
      )}
    </nav>
  );
}
