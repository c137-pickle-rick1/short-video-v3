import { getVideoDetail, getVideoComments, getRelatedVideos, getViewerProfile } from "@/lib/server/queries/video";
import { resolveViewerUserIdFromCookieToken } from "@/lib/server/auth";
import VideoPlayer from "@/components/video/VideoPlayer";
import VideoDetailReactions from "@/components/video/VideoDetailReactions";
import CommentsList from "@/components/video/CommentsList";
import VideoCard from "@/components/video/VideoCard";
import RecordView from "@/components/video/RecordView";
import ProfileFollowButton from "@/components/profile/ProfileFollowButton";
import EmptyState from "@/components/common/EmptyState";
import { cookies } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FilmStripIcon } from "@phosphor-icons/react/dist/ssr";
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
      viewerName={viewerName}
      viewerImage={viewerImage}
    />
  );
}

async function RelatedVideosSection({ videoId }: { videoId: number }) {
  const relatedVideos = await getRelatedVideos(videoId, 8);
  if (relatedVideos.length === 0) {
    return (
      <EmptyState
        icon={<FilmStripIcon size={20} weight="regular" />}
        title="暂无相关视频"
        description="有新的相关内容后，这里会自动更新。"
      />
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5">
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

      <div className="max-w-[1400px] mx-auto px-4 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* Left: player + info + comments */}
          <div>
            {/* Player */}
            <VideoPlayer video={video} />

            {/* Reactions: directly below video */}
            <div className="mt-3 mb-5">
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
              <div className="mb-5">
                <h1 className="text-2xl font-bold leading-[1.4] mb-3">
                  {video.displayText || "无标题"}
                </h1>

                {/* Categories & Tags */}
                {(video.categories.length > 0 || video.tags.length > 0) && (
                  <div className="flex flex-wrap gap-1.5">
                    {video.categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/categories/${cat.slug}`}
                        className="inline-block py-[3px] px-2.5 rounded-md text-base font-medium bg-bg-card text-text-secondary no-underline leading-[1.6] transition-colors border border-border-light hover:bg-bg-hover"
                      >
                        {cat.name}
                      </Link>
                    ))}
                    {video.tags.map((tag) => (
                      <Link
                        key={tag.id}
                        href={`/tags/${tag.slug}`}
                        className="inline-block py-[3px] px-2.5 rounded-md text-base font-medium bg-bg-card text-text-secondary no-underline leading-[1.6] transition-colors border border-border-light hover:bg-bg-hover"
                      >
                        {tag.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* 作者信息 作为独立区块 */}
              <div className="flex items-center gap-2.5 py-4 border-t border-b border-border mb-6">
                <Link href={video.author.profileUrl} className="flex items-center gap-2.5">
                  <Image
                    src={video.author.imageUrl}
                    alt={video.author.name}
                    width={46}
                    height={46}
                    className="rounded-full object-cover w-[46px] h-[46px] shrink-0"
                    unoptimized
                  />
                  <div>
                    <div className="font-semibold text-base text-text-primary">{video.author.name}</div>
                    <div className="text-[0.8125rem] text-text-muted">{video.postedAtText}</div>
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
                <div className="text-text-muted text-sm py-4">加载评论中…</div>
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
            <h3 className="text-[0.9375rem] font-bold mb-3">相关视频</h3>
            <Suspense fallback={
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-bg-card rounded-lg overflow-hidden opacity-60">
                    <div className="pb-[100%] bg-bg-hover" />
                    <div className="p-2">
                      <div className="h-3.5 bg-bg-hover rounded mb-1.5" />
                      <div className="h-3 w-3/5 bg-bg-hover rounded" />
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
    </>
  );
}
