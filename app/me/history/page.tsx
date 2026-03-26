import { getViewerHistory } from "@/lib/server/queries/user";
import { resolveViewerUserIdFromCookieToken } from "@/lib/server/auth";
import VideoGrid from "@/components/video/VideoGrid";
import ClearHistoryButton from "@/components/profile/ClearHistoryButton";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { VideoFeedItem } from "@/lib/types";

export default async function HistoryPage() {
  const jar = await cookies();
  const token = jar.get("sv_session")?.value ?? null;
  const viewerUserId = token ? await resolveViewerUserIdFromCookieToken(token) : null;
  if (!viewerUserId) redirect("/login?redirect_to=/me/history");

  let videos: VideoFeedItem[] = [];
  let error = null;

  try {
    videos = await getViewerHistory(viewerUserId);
  } catch (e) {
    error = e instanceof Error ? e.message : "加载失败";
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "1.25rem 1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Link href="/me" style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>个人中心</Link>
          <span style={{ color: "var(--text-muted)" }}>›</span>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>观看历史</h1>
        </div>
        {videos.length > 0 && <ClearHistoryButton />}
      </div>

      {error && (
        <div style={{ background: "#2d0a0a", border: "1px solid #5c1414", borderRadius: "8px", padding: "1rem", color: "#ff6b6b", fontSize: "0.875rem", marginBottom: "1rem" }}>
          ⚠️ {error}
        </div>
      )}

      <VideoGrid videos={videos} emptyMessage="暂无观看历史" />
    </div>
  );
}
