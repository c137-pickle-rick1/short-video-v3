import { getViewerHistory } from "@/lib/server/queries/user";
import { resolveViewerUserIdFromCookieToken } from "@/lib/server/auth";
import VideoGrid from "@/components/video/VideoGrid";
import ClearHistoryButton from "@/components/profile/ClearHistoryButton";
import Pagination from "@/components/layout/Pagination";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { VideoFeedItem } from "@/lib/types";

const PAGE_SIZE = 24;

export default async function HistoryPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const jar = await cookies();
  const token = jar.get("sv_session")?.value ?? null;
  const viewerUserId = token ? await resolveViewerUserIdFromCookieToken(token) : null;
  if (!viewerUserId) redirect("/login?redirect_to=/me/history");

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  let videos: VideoFeedItem[] = [];
  let total = 0;
  let error = null;

  try {
    const result = await getViewerHistory(viewerUserId, page, PAGE_SIZE);
    videos = result.videos;
    total = result.total;
  } catch (e) {
    error = e instanceof Error ? e.message : "加载失败";
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "1.25rem 1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Link href="/me" style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>个人中心</Link>
          <span style={{ color: "var(--text-muted)" }}>›</span>
          <h1 style={{ fontSize: "0.875rem", fontWeight: 600 }}>观看历史</h1>
        </div>
        {videos.length > 0 && <ClearHistoryButton />}
      </div>

      {error && (
        <div style={{ background: "#2d0a0a", border: "1px solid #5c1414", borderRadius: "8px", padding: "1rem", color: "#ff6b6b", fontSize: "0.875rem", marginBottom: "1rem" }}>
          ⚠️ {error}
        </div>
      )}

      <VideoGrid videos={videos} emptyMessage="暂无观看历史" />
      {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} basePath="/me/history" />}
    </div>
  );
}
