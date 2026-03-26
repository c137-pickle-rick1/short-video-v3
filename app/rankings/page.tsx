import { getRankingItems } from "@/lib/server/queries/feed";
import { resolveViewerUserIdFromCookieToken } from "@/lib/server/auth";
import { cookies } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import RankFollowButton from "@/components/profile/RankFollowButton";

export default async function RankingsPage() {
  const jar = await cookies();
  const token = jar.get("sv_session")?.value ?? null;
  const viewerUserId = token ? await resolveViewerUserIdFromCookieToken(token) : null;

  let items: Awaited<ReturnType<typeof getRankingItems>> = [];
  let error = null;

  try {
    items = await getRankingItems();
  } catch (e) {
    error = e instanceof Error ? e.message : "加载失败";
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "1.25rem 1rem" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.25rem" }}>排行榜</h1>

      {error && (
        <div style={{ background: "#2d0a0a", border: "1px solid #5c1414", borderRadius: "8px", padding: "1rem", color: "#ff6b6b", fontSize: "0.875rem" }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {items.map((item, idx) => {
          return (
            <div
              key={item.userId}
              style={{
                display: "flex",
                alignItems: "center",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "14px 16px",
                gap: "14px",
              }}
            >
              {/* Rank number */}
              <div style={{
                minWidth: "2rem",
                textAlign: "center",
                fontSize: idx < 3 ? "1.25rem" : "1rem",
                fontWeight: 700,
                color: idx === 0 ? "#ffd700" : idx === 1 ? "#c0c0c0" : idx === 2 ? "#cd7f32" : "var(--text-muted)",
              }}>
                {idx < 3 ? ["🥇","🥈","🥉"][idx] : `${idx + 1}`}
              </div>

              {/* Avatar */}
              <Link href={item.profileUrl} style={{ flexShrink: 0 }}>
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  width={46}
                  height={46}
                  style={{ borderRadius: "50%", objectFit: "cover" }}
                  unoptimized
                />
              </Link>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link href={item.profileUrl} style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text-primary)" }}>
                  {item.name}
                </Link>
                <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  {item.handle}
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: "flex", gap: "20px", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{item.totalVideos}</div>
                  <div>视频</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{item.publishedCount7d}</div>
                  <div>本周</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{item.lastPublishedAtText}</div>
                  <div>最近更新</div>
                </div>
              </div>

              {/* Follow button */}
              {viewerUserId && viewerUserId !== item.userId && (
                <RankFollowButton
                  targetUserId={item.userId}
                  initialFollowing={false}
                />
              )}
            </div>
          );
        })}

        {items.length === 0 && !error && (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>暂无数据</div>
        )}
      </div>
    </div>
  );
}
