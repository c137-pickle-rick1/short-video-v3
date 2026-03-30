import { getHomeFeedItems, getExploreFeedItems, normalizeExploreFeedSort, normalizeFeedSearchQuery } from "@/lib/server/queries/feed";
import VideoGrid from "@/components/video/VideoGrid";
import Pagination from "@/components/layout/Pagination";
import SortBar from "@/components/layout/SortBar";
import Link from "next/link";
import type { VideoFeedItem } from "@/lib/types";

const PAGE_SIZE = 24;

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
      <SortBar
        currentSort={sort}
        basePath="/"
        extraParams={searchQuery ? { q: searchQuery } : undefined}
        title={searchQuery ? (
          <span className="text-base text-text-secondary font-normal">
            <span className="text-text-primary font-semibold">{total}</span> 条相关结果
          </span>
        ) : undefined}
      />

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
