import { getVideoDetail, getVideoComments, getRelatedVideos, getViewerProfile } from "@/lib/server/queries/video";
import { resolveViewerUserIdFromCookieToken } from "@/lib/server/auth";
import VideoPlayer from "@/components/video/VideoPlayer";
import VideoDetailReactions from "@/components/video/VideoDetailReactions";
import CommentsList from "@/components/video/CommentsList";
import VideoCard from "@/components/video/VideoCard";
import { cookies } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VideoDetailPage({ params }: PageProps) {
  const { id } = await params;
  const videoId = parseInt(id, 10);
  if (isNaN(videoId)) notFound();

  const jar = await cookies();
  const token = jar.get("sv_session")?.value ?? null;
  const viewerUserId = token ? await resolveViewerUserIdFromCookieToken(token) : null;

  const [video, comments, relatedVideos, viewerProfile] = await Promise.all([
    getVideoDetail(videoId, viewerUserId),
    getVideoComments(videoId),
    getRelatedVideos(videoId, 8),
    viewerUserId ? getViewerProfile(viewerUserId) : null,
  ]);

  if (!video) notFound();

  // Record view (fire-and-forget — send from client via history API)
  const viewerLoggedIn = viewerUserId !== null;
  const viewerImage = viewerProfile
    ? (viewerProfile.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(viewerProfile.name ?? viewerProfile.username ?? "U")}&backgroundColor=e5192a&textColor=ffffff`)
    : null;

  return (
    <>
      {/* Fire-and-forget view tracking */}
      <RecordView videoId={String(video.videoId)} />

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "1.25rem 1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }} className="video-detail-layout">
          {/* Left: player + info + comments */}
          <div>
            {/* Player */}
            <VideoPlayer video={video} />

            {/* Title & reactions */}
            <div style={{ marginTop: "14px" }}>
              <h1 style={{ fontSize: "1.1rem", fontWeight: 700, lineHeight: 1.4, marginBottom: "10px" }}>
                {video.displayText || "无标题"}
              </h1>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
                {/* Author */}
                <Link href={video.author.profileUrl} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Image
                    src={video.author.imageUrl}
                    alt={video.author.name}
                    width={34}
                    height={34}
                    style={{ borderRadius: "50%", objectFit: "cover", width: 34, height: 34, flexShrink: 0 }}
                    unoptimized
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)" }}>{video.author.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{video.postedAtText}</div>
                  </div>
                </Link>

                {/* Reactions */}
                <VideoDetailReactions
                  videoId={video.videoId}
                  initialLikes={video.likeCount}
                  initialLiked={video.isLiked}
                  initialBookmarked={video.isBookmarked}
                  viewerLoggedIn={viewerLoggedIn}
                />
              </div>

              {/* Stats row */}
              <div style={{ display: "flex", gap: "16px", fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid var(--border)" }}>
                <span>▶ {video.viewCount} 次观看</span>
                <span>💬 {video.commentCount} 评论</span>
                <span>❤ {video.likeCount} 点赞</span>
              </div>

              {/* Comments */}
              <CommentsList
                videoId={video.videoId}
                initialComments={comments}
                viewerLoggedIn={viewerLoggedIn}
                viewerName={viewerProfile?.name}
                viewerImage={viewerImage}
              />
            </div>
          </div>

          {/* Right: related videos */}
          <aside>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "12px" }}>相关视频</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {relatedVideos.map((v) => (
                <VideoCard key={v.videoId} video={v} />
              ))}
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .video-detail-layout {
            grid-template-columns: 1fr 340px !important;
          }
        }
      `}</style>
    </>
  );
}

// Client component to record view on mount
function RecordView({ videoId }: { videoId: string }) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function(){
            try {
              fetch('/api/videos/${videoId}/history', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({})}).catch(()=>{});
            } catch(e) {}
          })();
        `,
      }}
    />
  );
}
