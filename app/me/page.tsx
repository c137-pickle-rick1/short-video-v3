import { getViewerProfile } from "@/lib/server/queries/video";
import { getViewerFollowStats } from "@/lib/server/queries/user";
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

  const [followStats] = await Promise.allSettled([getViewerFollowStats(viewerUserId)]);
  const stats = followStats.status === "fulfilled"
    ? followStats.value
    : { followingCount: 0, followerCount: 0 };

  const avatarUrl = profile.avatarUrl
    || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name ?? profile.username ?? "U")}&backgroundColor=e5192a&textColor=ffffff`;

  const profileCard = (
    <div className="bg-bg-card border border-border rounded-xl p-6 flex items-center gap-5 mb-6 flex-wrap">
      <Image src={avatarUrl} alt={profile.name ?? "我"} width={64} height={64}
        className="rounded-full object-cover" unoptimized />
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
  );

  return (
    <div className="max-w-[800px] mx-auto px-4 py-5">
      <h1 className="text-xl font-bold mb-6">个人中心</h1>

      {/* Profile card */}
      {profile.username ? (
        <Link
          href={`/user/${profile.username}`}
          className="block text-inherit no-underline"
          aria-label="打开公开个人主页"
        >
          {profileCard}
        </Link>
      ) : profileCard}

      {/* Quick links */}
      <div className="flex gap-2.5 flex-wrap mb-7">
        {[
          { href: "/me/creator", label: "创作者中心" },
          { href: "/me/history", label: "观看历史" },
          { href: "/me/bookmarks", label: "我的收藏" },
        ].map((link) => (
          <Link key={link.href} href={link.href}
            className="inline-flex items-center gap-1.5 rounded-md border border-border-light bg-transparent px-4 py-2 text-sm font-medium text-text-secondary transition-all hover:border-text-muted hover:text-text-primary cursor-pointer">
            {link.label}
          </Link>
        ))}
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
