import { getViewerProfile } from "@/lib/server/queries/video";
import { getMyVideos } from "@/lib/server/queries/user";
import { resolveViewerUserIdFromCookieToken } from "@/lib/server/auth";
import ProfileEditorForm from "@/components/profile/ProfileEditorForm";
import MyVideosSection from "@/components/profile/MyVideosSection";
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

  const [myVideos] = await Promise.allSettled([getMyVideos(viewerUserId)]);
  const uploadedVideos = myVideos.status === "fulfilled" ? myVideos.value : [];

  const avatarUrl = profile.avatarUrl
    || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name ?? profile.username ?? "U")}&backgroundColor=e5192a&textColor=ffffff`;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "1.25rem 1rem" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>个人中心</h1>

      {/* Profile card */}
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px",
        padding: "24px", display: "flex", alignItems: "center", gap: "20px", marginBottom: "24px", flexWrap: "wrap",
      }}>
        <Image src={avatarUrl} alt={profile.name ?? "我"} width={64} height={64}
          style={{ borderRadius: "50%", objectFit: "cover" }} unoptimized />
        <div>
          <div style={{ fontSize: "1.125rem", fontWeight: 700 }}>{profile.name || profile.username || "用户"}</div>
          {profile.username && <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>@{profile.username}</div>}
          {profile.email && <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{profile.email}</div>}
        </div>
      </div>

      {/* Quick links */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "28px" }}>
        {[
          { href: `/user/${profile.username}`, label: "查看主页" },
          { href: "/me/history", label: "观看历史" },
          { href: "/me/bookmarks", label: "我的收藏" },
          { href: "/subscriptions", label: "我的关注" },
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

      {/* My videos */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px" }}>
        <MyVideosSection initialVideos={uploadedVideos} />
      </div>
    </div>
  );
}
