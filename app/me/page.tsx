import { getViewerProfile } from "@/lib/server/queries/video";
import { getViewerFollowStats } from "@/lib/server/queries/user";
import { resolveViewerUserIdFromCookieToken } from "@/lib/server/auth";
import ProfileEditorForm from "@/components/profile/ProfileEditorForm";
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
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px",
      padding: "24px", display: "flex", alignItems: "center", gap: "20px", marginBottom: "24px", flexWrap: "wrap",
    }}>
      <Image src={avatarUrl} alt={profile.name ?? "我"} width={64} height={64}
        style={{ borderRadius: "50%", objectFit: "cover" }} unoptimized />
      <div>
        <div style={{ fontSize: "1.125rem", fontWeight: 700 }}>{profile.name || profile.username || "用户"}</div>
        <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
            关注 <strong style={{ color: "var(--text-primary)" }}>{stats.followingCount}</strong>
          </span>
          <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
            粉丝 <strong style={{ color: "var(--text-primary)" }}>{stats.followerCount}</strong>
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "1.25rem 1rem" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>个人中心</h1>

      {/* Profile card */}
      {profile.username ? (
        <Link
          href={`/user/${profile.username}`}
          style={{ display: "block", color: "inherit", textDecoration: "none" }}
          aria-label="打开公开个人主页"
        >
          {profileCard}
        </Link>
      ) : profileCard}

      {/* Quick links */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "28px" }}>
        {[
          { href: "/me/creator", label: "创作者中心" },
          { href: "/me/history", label: "观看历史" },
          { href: "/me/bookmarks", label: "我的收藏" },
        ].map((link) => (
          <Link key={link.href} href={link.href} className="btn-secondary"
            style={{ padding: "8px 16px", fontSize: "0.875rem" }}>
            {link.label}
          </Link>
        ))}
      </div>

      {/* Profile editor */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "16px" }}>修改资料</h2>
        <ProfileEditorForm name={profile.name} bio={profile.bio} username={profile.username} />
      </div>
    </div>
  );
}
