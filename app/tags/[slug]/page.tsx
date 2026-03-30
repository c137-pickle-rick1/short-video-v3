import { notFound } from "next/navigation";
import Pagination from "@/components/layout/Pagination";
import VideoGrid from "@/components/video/VideoGrid";
import { getVideosByTag } from "@/lib/server/queries/tag";
import type { VideoFeedItem } from "@/lib/types";

const PAGE_SIZE = 24;

export default async function TagDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  let videos: VideoFeedItem[] = [];
  let total = 0;
  let tagName = "";

  const result = await getVideosByTag(slug, page);
  if (!result.tag) notFound();

  videos = result.items;
  total = result.total;
  tagName = result.tag.name;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="max-w-[1400px] mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary m-0">
          <span className="text-accent">#</span>
          {tagName}
        </h1>
        {total > 0 && (
          <p className="mt-1 text-sm text-text-secondary">
            共 {total} 个视频
          </p>
        )}
      </div>

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
          basePath={`/tags/${slug}`}
        />
      )}
    </div>
  );
}
