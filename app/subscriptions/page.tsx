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
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "1.25rem 1rem" }}>
      {error && (
        <div style={{ background: "#2d0a0a", border: "1px solid #5c1414", borderRadius: "8px", padding: "1rem", color: "#ff6b6b", fontSize: "0.875rem", marginBottom: "1rem" }}>
          ⚠️ {error}
        </div>
      )}

      {isFollowingEmpty && !error && (
        <div style={{ marginBottom: "14px" }}>
          <EmptyState
            icon="✨"
            title="还没有关注"
            description="先从推荐创作者开始。"
          />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>
        {displayCreators.map((creator, index) => (
          <div
            key={creator.userId}
            className="creator-card"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "16px",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "10px",
            }}
          >
            <Link
              href={creator.profileUrl}
              prefetch={true}
              aria-label={`查看 ${creator.name} 的主页`}
              style={{ position: "absolute", inset: 0, borderRadius: "10px", zIndex: 2 }}
            />
            <Image
              className="creator-card-avatar"
              src={creator.imageUrl}
              alt={creator.name}
              width={56}
              height={56}
              loading={index === 0 ? "eager" : "lazy"}
              style={{ borderRadius: "50%", objectFit: "cover", position: "relative", zIndex: 1, pointerEvents: "none" }}
              unoptimized
            />
            <div className="creator-card-meta" style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", pointerEvents: "none" }}>
              <div className="creator-card-name" style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text-primary)" }}>
                {creator.name}
              </div>
              <div className="creator-card-stats" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                  {creator.totalVideos} 个视频
                </div>
                {viewerUserId && creator.isFollowing && creator.unreadCount > 0 && (
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: creator.unreadCount > 0 ? "var(--accent-orange)" : "var(--text-secondary)",
                      background: creator.unreadCount > 0 ? "rgba(249, 115, 22, 0.12)" : "rgba(153, 153, 153, 0.08)",
                      border: creator.unreadCount > 0 ? "1px solid rgba(249, 115, 22, 0.35)" : "1px solid rgba(153, 153, 153, 0.25)",
                      borderRadius: "999px",
                      padding: "2px 10px",
                    }}
                  >
                    {creator.unreadCount}个新视频
                  </div>
                )}
              </div>
            </div>
            <div className="creator-card-action" style={{ position: "relative", zIndex: 3 }}>
              {viewerUserId && viewerUserId !== creator.userId && (
                <ProfileFollowButton targetUserId={creator.userId} initialFollowing={creator.isFollowing} />
              )}
              {!viewerUserId && (
                <Link href="/login" className="btn-primary" style={{ display: "inline-block", padding: "6px 16px", fontSize: "0.8125rem" }}>
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
