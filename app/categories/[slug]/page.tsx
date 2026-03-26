import { getVideosByCategory } from "@/lib/server/queries/category";
import VideoGrid from "@/components/video/VideoGrid";
import Pagination from "@/components/layout/Pagination";
import type { VideoFeedItem } from "@/lib/types";
import { notFound } from "next/navigation";

const PAGE_SIZE = 24;

export default async function CategoryDetailPage({
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
  let categoryName = "";

  const result = await getVideosByCategory(slug, page);
  if (!result.category) notFound();

  videos = result.items;
  total = result.total;
  categoryName = result.category.name;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "1rem",
      }}
    >
      <div style={{ marginBottom: "1.5rem" }}>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          {categoryName}
        </h1>
        {total > 0 && (
          <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            共 {total} 个视频
          </p>
        )}
      </div>

      {videos.length === 0 ? (
        <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "3rem 0" }}>
          暂无视频
        </p>
      ) : (
        <VideoGrid videos={videos} />
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath={`/categories/${slug}`}
        />
      )}
    </div>
  );
}
