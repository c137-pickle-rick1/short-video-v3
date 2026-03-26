import { getHomeFeedItems, getExploreFeedItems, normalizeExploreFeedSort, normalizeFeedSearchQuery } from "@/lib/server/queries/feed";
import VideoGrid from "@/components/video/VideoGrid";
import Pagination from "@/components/layout/Pagination";
import Link from "next/link";
import type { VideoFeedItem } from "@/lib/types";

const PAGE_SIZE = 24;

const SORT_OPTIONS = [
  { key: "latest", label: "最新" },
  { key: "likes", label: "点赞最多" },
  { key: "bookmarks", label: "收藏最多" },
  { key: "comments", label: "评论最多" },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string; q?: string }>;
}) {
  const { page: pageParam, sort: sortParam, q: qParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const sort = normalizeExploreFeedSort(sortParam);
  const searchQuery = normalizeFeedSearchQuery(qParam);

  let videos: VideoFeedItem[] = [];
  let total = 0;
  let error = null;

  try {
    if (searchQuery) {
      const result = await getExploreFeedItems(sort, searchQuery, page);
      videos = result.items;
      total = result.total;
    } else {
      const result = await getHomeFeedItems(page, sort);
      videos = result.items;
      total = result.total;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "加载失败";
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "1rem",
      }}
    >
      {/* Error */}
      {error && (
        <div
          style={{
            background: "#2d0a0a",
            border: "1px solid #5c1414",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1rem",
            color: "#ff6b6b",
            fontSize: "0.875rem",
          }}
        >
          ⚠️ 数据库未连接: {error}。请检查环境变量配置。
        </div>
      )}

      {/* Search indicator */}
      {searchQuery && (
        <div style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          搜索：<span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{searchQuery}</span>
          {"  "}
          <Link href="/" style={{ color: "var(--accent)", fontSize: "0.8rem" }}>清除</Link>
        </div>
      )}

      {/* Sort tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {SORT_OPTIONS.map((opt) => (
          <Link
            key={opt.key}
            href={`/?sort=${opt.key}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}`}
            style={{
              padding: "5px 14px",
              borderRadius: "18px",
              fontSize: "0.8125rem",
              fontWeight: sort === opt.key ? 600 : 400,
              background: sort === opt.key ? "var(--accent)" : "var(--bg-card)",
              color: sort === opt.key ? "#fff" : "var(--text-secondary)",
              border: `1px solid ${sort === opt.key ? "var(--accent)" : "var(--border)"}`,
              transition: "all 0.15s",
            }}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {/* Video grid */}
      <VideoGrid videos={videos} />

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath="/"
          extraParams={{ ...(sort !== "latest" ? { sort } : {}), ...(searchQuery ? { q: searchQuery } : {}) }}
        />
      )}
    </div>
  );
}
