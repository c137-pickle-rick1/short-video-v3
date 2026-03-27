import { getVideoDetail, getVideoComments, getRelatedVideos, getViewerProfile } from "@/lib/server/queries/video";
import { resolveViewerUserIdFromCookieToken } from "@/lib/server/auth";
import VideoPlayer from "@/components/video/VideoPlayer";
import VideoDetailReactions from "@/components/video/VideoDetailReactions";
import CommentsList from "@/components/video/CommentsList";
import VideoCard from "@/components/video/VideoCard";
import RecordView from "@/components/video/RecordView";
import ProfileFollowButton from "@/components/profile/ProfileFollowButton";
import { cookies } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { VideoFeedItem } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

// ---- Deferred async components for streaming ----

async function CommentsSection({
  videoId,
  viewerLoggedIn,
  viewerUserId,
  viewerName,
  viewerImage,
}: {
  videoId: string;
  viewerLoggedIn: boolean;
  viewerUserId?: number | null;
  viewerName?: string | null;
  viewerImage?: string | null;
}) {
  const comments = await getVideoComments(parseInt(videoId, 10), viewerUserId);
  return (
    <CommentsList
      videoId={videoId}
      initialComments={comments}
      viewerLoggedIn={viewerLoggedIn}
      viewerUserId={viewerUserId}
      viewerName={viewerName}
      viewerImage={viewerImage}
    />
  );
}

async function RelatedVideosSection({ videoId }: { videoId: number }) {
  const relatedVideos = await getRelatedVideos(videoId, 8);
  return (
    <div className="related-videos-grid">
      {relatedVideos.map((v: VideoFeedItem) => (
        <VideoCard key={v.videoId} video={v} />
      ))}
    </div>
  );
}

// ---- Page (only fetches video detail + viewer profile, streams the rest) ----

export default async function VideoDetailPage({ params }: PageProps) {
  const { id } = await params;
  const videoId = parseInt(id, 10);
  if (isNaN(videoId)) notFound();

  const jar = await cookies();
  const token = jar.get("sv_session")?.value ?? null;
  const viewerUserId = token ? await resolveViewerUserIdFromCookieToken(token) : null;

  const [video, viewerProfile] = await Promise.all([
    getVideoDetail(videoId, viewerUserId),
    viewerUserId ? getViewerProfile(viewerUserId) : null,
  ]);

  if (!video) notFound();

  // Record view (fire-and-forget — send from client via history API)
  const viewerLoggedIn = viewerUserId !== null;
  const authorUserId = typeof video.author.userId === "number" && video.author.userId > 0
    ? video.author.userId
    : null;
  const canFollowAuthor = authorUserId !== null && viewerUserId !== authorUserId;
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

            {/* Reactions: directly below video */}
            <div style={{ marginTop: "12px", marginBottom: "20px" }}>
              <VideoDetailReactions
                videoId={video.videoId}
                initialLikes={video.likeCount}
                initialLiked={video.isLiked}
                initialBookmarked={video.isBookmarked}
                viewerLoggedIn={viewerLoggedIn}
              />
            </div>

            {/* Title & meta */}
            <div>
              {/* 标题 + 分类/标签 作为一组 */}
              <div style={{ marginBottom: "20px" }}>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.4, marginBottom: "12px" }}>
                  {video.displayText || "无标题"}
                </h1>

                {/* Categories & Tags */}
                {(video.categories.length > 0 || video.tags.length > 0) && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {video.categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/categories/${cat.slug}`}
                        style={{
                          display: "inline-block",
                          padding: "3px 10px",
                          borderRadius: "6px",
                          fontSize: "1rem",
                          fontWeight: 500,
                          background: "var(--bg-card)",
                          color: "var(--text-secondary)",
                          textDecoration: "none",
                          lineHeight: 1.6,
                          transition: "background 0.15s",
                          border: "1px solid var(--border-light)",
                        }}
                      >
                        {cat.name}
                      </Link>
                    ))}
                    {video.tags.map((tag) => (
                      <Link
                        key={tag.id}
                        href={`/tags/${tag.slug}`}
                        style={{
                          display: "inline-block",
                          padding: "3px 10px",
                          borderRadius: "6px",
                          fontSize: "1rem",
                          fontWeight: 500,
                          background: "var(--bg-card)",
                          color: "var(--text-secondary)",
                          textDecoration: "none",
                          lineHeight: 1.6,
                          transition: "background 0.15s",
                          border: "1px solid var(--border-light)",
                        }}
                      >
                        {tag.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* 作者信息 作为独立区块 */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingTop: "16px", paddingBottom: "16px", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", marginBottom: "24px" }}>
                <Link href={video.author.profileUrl} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Image
                    src={video.author.imageUrl}
                    alt={video.author.name}
                    width={46}
                    height={46}
                    style={{ borderRadius: "50%", objectFit: "cover", width: 46, height: 46, flexShrink: 0 }}
                    unoptimized
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "1rem", color: "var(--text-primary)" }}>{video.author.name}</div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{video.postedAtText}</div>
                  </div>
                </Link>

                {canFollowAuthor ? (
                  <ProfileFollowButton
                    targetUserId={authorUserId}
                    initialFollowing={Boolean(video.isFollowingAuthor)}
                  />
                ) : null}
              </div>

              {/* Comments */}
              <Suspense fallback={
                <div style={{ color: "var(--text-muted)", fontSize: "0.875rem", padding: "16px 0" }}>加载评论中…</div>
              }>
                <CommentsSection
                  videoId={video.videoId}
                  viewerLoggedIn={viewerLoggedIn}
                  viewerUserId={viewerUserId}
                  viewerName={viewerProfile?.name}
                  viewerImage={viewerImage}
                />
              </Suspense>
            </div>
          </div>

          {/* Right: related videos */}
          <aside>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "12px" }}>相关视频</h3>
            <Suspense fallback={
              <div className="related-videos-grid">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ background: "var(--bg-card)", borderRadius: "8px", overflow: "hidden", opacity: 0.6 }}>
                    <div style={{ paddingBottom: "100%", background: "var(--bg-hover)" }} />
                    <div style={{ padding: "8px" }}>
                      <div style={{ height: "14px", background: "var(--bg-hover)", borderRadius: "4px", marginBottom: "6px" }} />
                      <div style={{ height: "12px", width: "60%", background: "var(--bg-hover)", borderRadius: "4px" }} />
                    </div>
                  </div>
                ))}
              </div>
            }>
              <RelatedVideosSection videoId={videoId} />
            </Suspense>
          </aside>
        </div>
      </div>

      <style>{`
        .related-videos-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        @media (min-width: 1024px) {
          .video-detail-layout {
            grid-template-columns: 1fr 340px !important;
          }
          .related-videos-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
