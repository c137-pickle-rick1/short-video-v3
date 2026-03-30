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
    items = await getRankingItems(viewerUserId);
  } catch (e) {
    error = e instanceof Error ? e.message : "加载失败";
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 py-5">
      <h1 className="text-xl font-bold mb-5">本周发布榜</h1>

      {error && (
        <div className="bg-[#2d0a0a] border border-[#5c1414] rounded-lg p-4 text-[#ff6b6b] text-sm">
          ⚠️ {error}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {items.map((item, idx) => {
          return (
            <div
              key={item.userId}
              className="flex items-center bg-bg-card border border-border rounded-[10px] py-3.5 px-4 gap-3.5"
            >
              {/* Rank number */}
              <div className={`min-w-[2rem] text-center font-bold ${
                idx < 3 ? "text-xl" : "text-base"
              } ${
                idx === 0 ? "text-[#ffd700]" : idx === 1 ? "text-[#c0c0c0]" : idx === 2 ? "text-[#cd7f32]" : "text-text-secondary"
              }`}>
                {idx < 3 ? ["🥇","🥈","🥉"][idx] : `${idx + 1}`}
              </div>

              {/* Avatar */}
              <Link href={item.profileUrl} className="shrink-0">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  width={46}
                  height={46}
                  className="rounded-full object-cover"
                  unoptimized
                />
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link href={item.profileUrl} className="font-semibold text-[0.9375rem] text-text-primary">
                  {item.name}
                </Link>
                <div className="text-[0.8125rem] text-text-muted mt-0.5">
                  {item.handle}
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-5 text-[0.8125rem] text-text-secondary">
                <div className="text-center">
                  <div className="font-semibold text-text-primary">{item.totalVideos}</div>
                  <div>视频</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-text-primary">{item.publishedCount7d}</div>
                  <div>本周</div>
                </div>
              </div>

              {/* Follow button */}
              {viewerUserId && (
                <RankFollowButton
                  targetUserId={item.userId}
                  initialFollowing={item.isFollowing}
                  disabled={viewerUserId === item.userId}
                />
              )}
            </div>
          );
        })}

        {items.length === 0 && !error && (
          <div className="text-center p-12 text-text-muted">暂无数据</div>
        )}
      </div>
    </div>
  );
}
