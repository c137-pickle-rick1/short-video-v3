import { getPublicProfile } from "@/lib/server/queries/user";
import { resolveViewerUserIdFromCookieToken } from "@/lib/server/auth";
import VideoGrid from "@/components/video/VideoGrid";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProfileFollowButton from "@/components/profile/ProfileFollowButton";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);

  const jar = await cookies();
  const token = jar.get("sv_session")?.value ?? null;
  const viewerUserId = token ? await resolveViewerUserIdFromCookieToken(token) : null;

  const profile = await getPublicProfile(decodedUsername, viewerUserId);
  if (!profile) notFound();

  const isOwnProfile = viewerUserId === profile.userId;

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.25rem 1rem" }}>
      {/* Profile header */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "24px",
        display: "flex",
        alignItems: "flex-start",
        gap: "20px",
        flexWrap: "wrap",
        marginBottom: "24px",
      }}>
        <Image
          src={profile.imageUrl}
          alt={profile.name}
          width={80}
          height={80}
          style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
          unoptimized
        />

        <div style={{ flex: 1, minWidth: "200px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "6px" }}>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>{profile.name}</h1>
            <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{profile.handle}</span>
          </div>

          {profile.bio && (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.5, marginBottom: "12px" }}>
              {profile.bio}
            </p>
          )}

          <div style={{ display: "flex", gap: "20px", fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "12px" }}>
            <span><strong style={{ color: "var(--text-primary)" }}>{profile.videoCount}</strong> 视频</span>
            <span><strong style={{ color: "var(--text-primary)" }}>{profile.followerCount}</strong> 粉丝</span>
            <span><strong style={{ color: "var(--text-primary)" }}>{profile.followingCount}</strong> 关注</span>
          </div>

          {isOwnProfile ? (
            <Link href="/me" className="btn-secondary" style={{ display: "inline-block", padding: "6px 16px", fontSize: "0.875rem" }}>
              编辑资料
            </Link>
          ) : viewerUserId ? (
            <ProfileFollowButton
              targetUserId={profile.userId}
              initialFollowing={profile.isFollowing}
            />
          ) : (
            <Link href="/login" className="btn-primary" style={{ display: "inline-block", padding: "6px 16px", fontSize: "0.875rem" }}>
              关注
            </Link>
          )}
        </div>
      </div>

      {/* Videos */}
      <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "14px" }}>发布的视频</h2>
      <VideoGrid videos={profile.videos} emptyMessage="该用户暂无公开视频" />
    </div>
  );
}
