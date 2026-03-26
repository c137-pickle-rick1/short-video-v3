import { getDb } from "@/lib/db";
import VideoGrid from "@/components/video/VideoGrid";
import type { VideoFeedItem } from "@/lib/types";
import {
  formatDuration, formatRelativeTime, getDisplayName,
  getProfileUrl, getVideoUrl, normalizeAvatarUrl, getVideoSummary,
  getFrameClass, getVideoMediaUrls,
} from "@/lib/server/presenters";
import Link from "next/link";

type AuthorFields = { name: string | null; username: string | null; avatar_url: string | null };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TagDetailPage({ params }: PageProps) {
  const { id } = await params;
  const tagName = decodeURIComponent(id);

  let videos: VideoFeedItem[] = [];
  let error = null;

  try {
    const { data: tagRow } = await getDb()
      .from("tags")
      .select("id")
      .eq("name", tagName)
      .maybeSingle();

    if (tagRow) {
      const { data: videoTagRows } = await getDb()
        .from("video_tags")
        .select("video_id")
        .eq("tag_id", tagRow.id);

      const videoIds = (videoTagRows ?? []).map((r: { video_id: number }) => r.video_id);

      if (videoIds.length > 0) {
        const { data: rows } = await getDb()
          .from("videos")
          .select(`
            id, origin, legacy_tweet_id, title, caption, description,
            poster_url, playback_url, hls_url, duration_text, duration_seconds,
            width, height, published_at, created_at,
            author:users!uploader_user_id(name, username, avatar_url)
          `)
          .in("id", videoIds)
          .eq("status", "published")
          .eq("visibility", "public")
          .order("created_at", { ascending: false })
          .limit(48);

        videos = (rows ?? []).map((row: unknown) => {
          const r = row as { id: number; origin: string | null; legacy_tweet_id: string | null; title: string | null; caption: string | null; description: string | null; poster_url: string | null; playback_url: string | null; hls_url: string | null; duration_text: string | null; duration_seconds: number | null; width: number | null; height: number | null; published_at: string | null; created_at: string | null; author: AuthorFields | null };
          const mediaUrls = getVideoMediaUrls(r.origin, r.playback_url, r.hls_url);
          return {
            videoId: String(r.id),
            tweetId: r.legacy_tweet_id ?? "",
            displayText: getVideoSummary(r.title, r.caption, r.description),
            detailUrl: getVideoUrl(r.id),
            postedAtText: formatRelativeTime(r.published_at ?? r.created_at),
            media: {
              posterUrl: r.poster_url ?? "",
              videoUrl: mediaUrls.fallbackUrl,
              hlsUrl: mediaUrls.hlsUrl,
              durationText: r.duration_text || formatDuration(r.duration_seconds),
              frameClass: getFrameClass(r.width, r.height),
            },
            author: {
              name: getDisplayName(r.author?.name ?? null, r.author?.username ?? null),
              imageUrl: normalizeAvatarUrl(r.author?.avatar_url ?? null, r.author?.name ?? null, r.author?.username ?? null),
              profileUrl: getProfileUrl(r.author?.username ?? null),
            },
          };
        });
      }
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "加载失败";
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "1.25rem 1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
        <Link href="/tags" style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>标签</Link>
        <span style={{ color: "var(--text-muted)" }}>›</span>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
          <span style={{ color: "var(--accent)" }}>#</span>{tagName}
        </h1>
        <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>({videos.length} 个视频)</span>
      </div>

      {error && (
        <div style={{ background: "#2d0a0a", border: "1px solid #5c1414", borderRadius: "8px", padding: "1rem", color: "#ff6b6b", fontSize: "0.875rem", marginBottom: "1rem" }}>
          ⚠️ {error}
        </div>
      )}

      <VideoGrid videos={videos} emptyMessage={`#${tagName} 暂无视频`} />
    </div>
  );
}
