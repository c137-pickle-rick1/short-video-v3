import { notFound } from "next/navigation";
import Pagination from "@/components/layout/Pagination";
import SortBar from "@/components/layout/SortBar";
import VideoGrid from "@/components/video/VideoGrid";
import { getVideosByTag } from "@/lib/server/queries/tag";
import { normalizeExploreFeedSort } from "@/lib/server/queries/feed";
import type { VideoFeedItem } from "@/lib/types";

const PAGE_SIZE = 24;

export default async function TagDetailPage({
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
  let tagName = "";

  const result = await getVideosByTag(slug, page, sort);
  if (!result.tag) notFound();

  videos = result.items;
  total = result.total;
  tagName = result.tag.name;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="max-w-[1400px] mx-auto p-4">
      <SortBar
        currentSort={sort}
        basePath={`/tags/${slug}`}
        title={<><span className="text-accent">#</span>{tagName}</>}
      />

      {videos.length === 0 ? (
        <p className="text-text-secondary text-center py-12">
          暂无视频
        </p>
      ) : (
        <VideoGrid videos={videos} />
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath={`/tags/${slug}${sort !== "latest" ? `?sort=${sort}` : ""}`}
        />
      )}
    </div>
  );
}
