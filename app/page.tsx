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
    <div className="max-w-[1400px] mx-auto p-4">
      {/* Error */}
      {error && (
        <div className="bg-[#2d0a0a] border border-[#5c1414] rounded-lg p-4 mb-4 text-[#ff6b6b] text-sm">
          ⚠️ 数据库未连接: {error}。请检查环境变量配置。
        </div>
      )}

      {/* Search indicator */}
      {searchQuery && (
        <div className="mb-4 text-[0.9rem] text-text-secondary">
          搜索：<span className="text-text-primary font-semibold">{searchQuery}</span>
          {"  "}
          <Link href="/" className="text-accent text-[0.8rem]">清除</Link>
        </div>
      )}

      {/* Sort tabs */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {SORT_OPTIONS.map((opt) => (
          <Link
            key={opt.key}
            href={`/?sort=${opt.key}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}`}
            className={`px-3.5 py-1 rounded-full text-[0.8125rem] border transition-all ${
              sort === opt.key
                ? "font-semibold bg-accent text-white border-accent"
                : "font-normal bg-bg-card text-text-secondary border-border"
            }`}
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
