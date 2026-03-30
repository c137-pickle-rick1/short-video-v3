import { getViewerProfile } from "@/lib/server/queries/video";
import { getViewerFollowStats, getViewerWatchHeatmap, getViewerHistory, getViewerBookmarks } from "@/lib/server/queries/user";
import WatchHeatmap from "@/components/profile/WatchHeatmap";
import VideoCard from "@/components/video/VideoCard";
import { resolveViewerUserIdFromCookieToken } from "@/lib/server/auth";
import ProfileEditorForm from "@/components/profile/ProfileEditorForm";
import LogoutButton from "@/components/profile/LogoutButton";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default async function MePage() {
  const jar = await cookies();
  const token = jar.get("sv_session")?.value ?? null;
  const viewerUserId = token ? await resolveViewerUserIdFromCookieToken(token) : null;
  if (!viewerUserId) redirect("/login?redirect_to=/me");

  const profile = await getViewerProfile(viewerUserId);
  if (!profile) redirect("/login");

  const [followStats, heatmapResult, historyResult, bookmarksResult] = await Promise.allSettled([
    getViewerFollowStats(viewerUserId),
    getViewerWatchHeatmap(viewerUserId),
    getViewerHistory(viewerUserId, 1, 8),
    getViewerBookmarks(viewerUserId, 1, 8),
  ]);
  const stats = followStats.status === "fulfilled"
    ? followStats.value
    : { followingCount: 0, followerCount: 0 };
  const heatmapData = heatmapResult.status === "fulfilled" ? heatmapResult.value : [];
  const history = historyResult.status === "fulfilled" ? historyResult.value : { videos: [], total: 0 };
  const bookmarks = bookmarksResult.status === "fulfilled" ? bookmarksResult.value : { videos: [], total: 0 };

  const avatarUrl = profile.avatarUrl
    || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name ?? profile.username ?? "U")}&backgroundColor=e5192a&textColor=ffffff`;

  const profileUrl = profile.username ? `/user/${profile.username}` : null;

  const profileCard = (
    <div className="bg-bg-card border border-border rounded-xl p-6 flex items-center gap-5 mb-6 flex-wrap">
      {profileUrl ? (
        <Link href={profileUrl} className="flex items-center gap-5 flex-1 min-w-0 text-inherit no-underline">
          <Image src={avatarUrl} alt={profile.name ?? "我"} width={64} height={64}
            className="rounded-full object-cover shrink-0" unoptimized />
          <div>
            <div className="text-lg font-bold">{profile.name || profile.username || "用户"}</div>
            <div className="mt-2 flex items-center gap-3.5 flex-wrap">
              <span className="text-[0.8125rem] text-text-secondary">
                关注 <strong className="text-text-primary">{stats.followingCount}</strong>
              </span>
              <span className="text-[0.8125rem] text-text-secondary">
                粉丝 <strong className="text-text-primary">{stats.followerCount}</strong>
              </span>
            </div>
          </div>
        </Link>
      ) : (
        <div className="flex items-center gap-5 flex-1 min-w-0">
          <Image src={avatarUrl} alt={profile.name ?? "我"} width={64} height={64}
            className="rounded-full object-cover shrink-0" unoptimized />
          <div>
            <div className="text-lg font-bold">{profile.name || profile.username || "用户"}</div>
            <div className="mt-2 flex items-center gap-3.5 flex-wrap">
              <span className="text-[0.8125rem] text-text-secondary">
                关注 <strong className="text-text-primary">{stats.followingCount}</strong>
              </span>
              <span className="text-[0.8125rem] text-text-secondary">
                粉丝 <strong className="text-text-primary">{stats.followerCount}</strong>
              </span>
            </div>
          </div>
        </div>
      )}
      <Link href="/me/creator"
        className="ml-auto shrink-0 inline-flex items-center gap-1.5 rounded-md border border-border-light bg-transparent px-4 py-2 text-sm font-medium text-text-secondary transition-all hover:border-text-muted hover:text-text-primary">
        创作者中心
      </Link>
    </div>
  );

  return (
    <div className="max-w-[800px] mx-auto px-4 py-5">
      <h1 className="text-xl font-bold mb-6">个人中心</h1>

      {/* Profile card */}
      {profileCard}

      {/* Watch heatmap */}
      <WatchHeatmap data={heatmapData} />

      {/* 观看历史 */}
      <div className="bg-bg-card border border-border rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">观看历史</h2>
          {history.total > 0 && (
            <Link href="/me/history" className="text-xs text-text-secondary hover:text-text-primary transition-colors">
              查看全部 ({history.total})&nbsp;›
            </Link>
          )}
        </div>
        {history.videos.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-hide">
            {history.videos.map((v) => (
              <div key={v.videoId} className="w-40 shrink-0">
                <VideoCard video={v} showAuthor={false} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted py-6 text-center">暂无观看记录</p>
        )}
      </div>

      {/* 我的收藏 */}
      <div className="bg-bg-card border border-border rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">我的收藏</h2>
          {bookmarks.total > 0 && (
            <Link href="/me/bookmarks" className="text-xs text-text-secondary hover:text-text-primary transition-colors">
              查看全部 ({bookmarks.total})&nbsp;›
            </Link>
          )}
        </div>
        {bookmarks.videos.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-hide">
            {bookmarks.videos.map((v) => (
              <div key={v.videoId} className="w-40 shrink-0">
                <VideoCard video={v} showAuthor={false} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted py-6 text-center">暂无收藏</p>
        )}
      </div>

      {/* Profile editor */}
      <div className="bg-bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="text-base font-bold mb-4">修改资料</h2>
        <ProfileEditorForm name={profile.name} bio={profile.bio} username={profile.username} email={profile.email} avatarUrl={profile.avatarUrl} />
      </div>

      {/* Logout */}
      <div className="mt-2 mb-8">
        <LogoutButton />
      </div>
    </div>
  );
}
