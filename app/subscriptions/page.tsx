import { getRankingItems } from "@/lib/server/queries/feed";
import { resolveViewerUserIdFromCookieToken } from "@/lib/server/auth";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import ProfileFollowButton from "@/components/profile/ProfileFollowButton";

export default async function SubscriptionsPage() {
  const jar = await cookies();
  const token = jar.get("sv_session")?.value ?? null;
  const viewerUserId = token ? await resolveViewerUserIdFromCookieToken(token) : null;

  let creators: Awaited<ReturnType<typeof getRankingItems>> = [];
  let error = null;

  try {
    creators = await getRankingItems();
  } catch (e) {
    error = e instanceof Error ? e.message : "加载失败";
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "1.25rem 1rem" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.25rem" }}>关注创作者</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>发现并关注你喜欢的创作者</p>

      {error && (
        <div style={{ background: "#2d0a0a", border: "1px solid #5c1414", borderRadius: "8px", padding: "1rem", color: "#ff6b6b", fontSize: "0.875rem", marginBottom: "1rem" }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>
        {creators.map((creator) => (
          <div
            key={creator.userId}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "10px",
            }}
          >
            <Link href={creator.profileUrl}>
              <Image
                src={creator.imageUrl}
                alt={creator.name}
                width={56}
                height={56}
                style={{ borderRadius: "50%", objectFit: "cover" }}
                unoptimized
              />
            </Link>
            <div>
              <Link href={creator.profileUrl} style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text-primary)" }}>
                {creator.name}
              </Link>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{creator.handle}</div>
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              {creator.totalVideos} 个视频
            </div>
            {viewerUserId && viewerUserId !== creator.userId && (
              <ProfileFollowButton targetUserId={creator.userId} initialFollowing={false} />
            )}
            {!viewerUserId && (
              <Link href="/login" className="btn-primary" style={{ display: "inline-block", padding: "6px 16px", fontSize: "0.8125rem" }}>
                关注
              </Link>
            )}
          </div>
        ))}
      </div>

      {creators.length === 0 && !error && (
        <p style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>暂无创作者</p>
      )}
    </div>
  );
}
