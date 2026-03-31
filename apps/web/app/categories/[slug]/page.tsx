import { getVideosByCategory } from "@/lib/server/queries/category";
import { normalizeExploreFeedSort } from "@/lib/server/queries/feed";
import VideoGrid from "@/components/video/VideoGrid";
import Pagination from "@/components/layout/Pagination";
import SortBar from "@/components/layout/SortBar";
import type { VideoFeedItem } from "@/lib/types";
import { notFound } from "next/navigation";

const PAGE_SIZE = 24;

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam, sort: sortParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const sort = normalizeExploreFeedSort(sortParam);

  let videos: VideoFeedItem[] = [];
  let total = 0;
  let categoryName = "";

  const result = await getVideosByCategory(slug, page, sort);
  if (!result.category) notFound();

  videos = result.items;
  total = result.total;
  categoryName = result.category.name;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="max-w-[1400px] mx-auto p-4">
      <SortBar currentSort={sort} basePath={`/categories/${slug}`} title={categoryName} />

      <VideoGrid
        videos={videos}
        emptyMessage="暂无分类视频"
        emptyDescription="该分类关联到新视频后，这里会自动更新。"
      />

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath={`/categories/${slug}${sort !== "latest" ? `?sort=${sort}` : ""}`}
        />
      )}
    </div>
  );
}
