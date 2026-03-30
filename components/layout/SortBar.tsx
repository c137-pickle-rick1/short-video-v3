import Link from "next/link";
import type { ReactNode } from "react";

const SORT_OPTIONS = [
  { key: "latest", label: "最新" },
  { key: "likes", label: "点赞最多" },
  { key: "bookmarks", label: "收藏最多" },
  { key: "comments", label: "评论最多" },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]["key"];

interface SortBarProps {
  currentSort: string;
  basePath: string;
  extraParams?: Record<string, string>;
  title?: ReactNode;
}

export default function SortBar({ currentSort, basePath, extraParams, title }: SortBarProps) {
  function buildHref(sortKey: SortKey) {
    const params = new URLSearchParams({ sort: sortKey, ...extraParams });
    return `${basePath}?${params.toString()}`;
  }

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
      {title ? (
        <h1 className="text-2xl font-bold text-text-primary m-0">{title}</h1>
      ) : (
        <div />
      )}
      <div className="flex gap-1.5 flex-wrap">
        {SORT_OPTIONS.map((opt) => (
          <Link
            key={opt.key}
            href={buildHref(opt.key)}
            className={`px-3.5 py-1 rounded-full text-[0.8125rem] border transition-all ${
              currentSort === opt.key
                ? "font-semibold bg-accent text-white border-accent"
                : "font-normal bg-bg-card text-text-secondary border-border"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
