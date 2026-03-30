import { getRankingItems } from "@/lib/server/queries/feed";
import { resolveViewerUserIdFromCookieToken } from "@/lib/server/auth";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import ProfileFollowButton from "@/components/profile/ProfileFollowButton";
import EmptyState from "@/components/common/EmptyState";

export default async function SubscriptionsPage() {
  const jar = await cookies();
  const token = jar.get("sv_session")?.value ?? null;
  const viewerUserId = token ? await resolveViewerUserIdFromCookieToken(token) : null;

  let creators: Awaited<ReturnType<typeof getRankingItems>> = [];
  let error = null;

  try {
    creators = await getRankingItems(viewerUserId);
  } catch (e) {
    error = e instanceof Error ? e.message : "加载失败";
  }

  const visibleCreators = creators.filter((c) => c.userId !== viewerUserId);
  const followedCreators = visibleCreators.filter((c) => c.isFollowing);
  const recommendedCreators = visibleCreators.filter((c) => !c.isFollowing);
  const isFollowingEmpty = followedCreators.length === 0;
  const displayCreators = isFollowingEmpty ? recommendedCreators : followedCreators;

  return (
    <div className="max-w-[900px] mx-auto px-4 py-5">
      {error && (
        <div className="bg-[#2d0a0a] border border-[#5c1414] rounded-lg p-4 text-[#ff6b6b] text-sm mb-4">
          ⚠️ {error}
        </div>
      )}

      {isFollowingEmpty && !error && (
        <div className="mb-3.5">
          <EmptyState
            icon="✨"
            title="还没有关注"
            description="先从推荐创作者开始。"
          />
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
        {displayCreators.map((creator, index) => (
          <div
            key={creator.userId}
            className="creator-card relative flex flex-col items-center text-center gap-2.5 bg-bg-card border border-border rounded-[10px] p-4"
          >
            <Link
              href={creator.profileUrl}
              prefetch={true}
              aria-label={`查看 ${creator.name} 的主页`}
              className="absolute inset-0 rounded-[10px] z-[2]"
            />
            <Image
              className="creator-card-avatar rounded-full object-cover relative z-[1] pointer-events-none"
              src={creator.imageUrl}
              alt={creator.name}
              width={56}
              height={56}
              loading={index === 0 ? "eager" : "lazy"}
              unoptimized
            />
            <div className="creator-card-meta relative z-[1] flex flex-col items-center gap-2 pointer-events-none">
              <div className="creator-card-name font-semibold text-[0.9375rem] text-text-primary">
                {creator.name}
              </div>
              <div className="creator-card-stats flex items-center gap-2 flex-wrap">
                <div className="text-[0.8125rem] text-text-secondary">
                  {creator.totalVideos} 个视频
                </div>
                {viewerUserId && creator.isFollowing && creator.unreadCount > 0 && (
                  <div className="text-xs text-accent-orange bg-[rgba(249,115,22,0.12)] border border-[rgba(249,115,22,0.35)] rounded-full px-2.5 py-0.5">
                    {creator.unreadCount}个新视频
                  </div>
                )}
              </div>
            </div>
            <div className="creator-card-action relative z-[3]">
              {viewerUserId && viewerUserId !== creator.userId && (
                <ProfileFollowButton targetUserId={creator.userId} initialFollowing={creator.isFollowing} />
              )}
              {!viewerUserId && (
                <Link href="/login" className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-1.5 text-[0.8125rem] font-semibold text-white border-none cursor-pointer transition-colors hover:bg-accent-hover">
                  关注
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {displayCreators.length === 0 && !error && (
        <EmptyState
          icon="👀"
          title={isFollowingEmpty ? "暂无推荐" : "关注列表为空"}
          description={isFollowingEmpty ? "稍后再来看看。" : "去发现页关注更多创作者。"}
        />
      )}
    </div>
  );
}
