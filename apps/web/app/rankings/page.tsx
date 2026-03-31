import {
  getCreatorPublishRanking,
  getCreatorFollowerRanking,
  getCreatorLikedRanking,
  getVideoStatRanking,
} from "@/lib/server/queries/feed";
import type { RankingTab, RankingPeriod, CreatorRankingItem, VideoRankingItem } from "@/lib/types";
import { resolveViewerUserIdFromCookieToken } from "@/lib/server/auth";
import { cookies } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { TrophyIcon } from "@phosphor-icons/react/dist/ssr";
import RankFollowButton from "@/components/profile/RankFollowButton";
import EmptyState from "@/components/common/EmptyState";

const TABS: { key: RankingTab; label: string; group: "creator" | "video" }[] = [
  { key: "prolific", label: "高产创作者", group: "creator" },
  { key: "popular", label: "人气创作者", group: "creator" },
  { key: "loved", label: "最受喜爱", group: "creator" },
  { key: "views", label: "热门播放", group: "video" },
  { key: "likes", label: "最多点赞", group: "video" },
  { key: "bookmarks", label: "最多收藏", group: "video" },
  { key: "comments", label: "热议视频", group: "video" },
];

const PERIODS: { key: RankingPeriod; label: string }[] = [
  { key: "week", label: "本周" },
  { key: "month", label: "本月" },
];

const STAT_LABELS: Record<RankingTab, string> = {
  prolific: "发布",
  popular: "新粉丝",
  loved: "获赞",
  views: "播放",
  likes: "点赞",
  bookmarks: "收藏",
  comments: "评论",
};

function isValidTab(v: string | undefined): v is RankingTab {
  return TABS.some((t) => t.key === v);
}
function isValidPeriod(v: string | undefined): v is RankingPeriod {
  return v === "week" || v === "month";
}

function RankBadge({ idx }: { idx: number }) {
  if (idx < 3) {
    return (
      <div className="min-w-8 text-center text-xl font-bold">
        {["🥇", "🥈", "🥉"][idx]}
      </div>
    );
  }
  return (
    <div className="min-w-8 text-center text-base font-bold text-text-secondary">
      {idx + 1}
    </div>
  );
}

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; period?: string }>;
}) {
  const params = await searchParams;
  const tab: RankingTab = isValidTab(params.tab) ? params.tab : "prolific";
  const period: RankingPeriod = isValidPeriod(params.period) ? params.period : "week";
  const isCreatorTab = ["prolific", "popular", "loved"].includes(tab);

  const jar = await cookies();
  const token = jar.get("sv_session")?.value ?? null;
  const viewerUserId = token ? await resolveViewerUserIdFromCookieToken(token) : null;

  let creatorItems: CreatorRankingItem[] = [];
  let videoItems: VideoRankingItem[] = [];
  let error: string | null = null;

  try {
    if (tab === "prolific") {
      creatorItems = await getCreatorPublishRanking(period, viewerUserId);
    } else if (tab === "popular") {
      creatorItems = await getCreatorFollowerRanking(period, viewerUserId);
    } else if (tab === "loved") {
      creatorItems = await getCreatorLikedRanking(period, viewerUserId);
    } else {
      videoItems = await getVideoStatRanking(tab, period);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "加载失败";
  }

  const statLabel = STAT_LABELS[tab];

  return (
    <div className="max-w-[900px] mx-auto px-4 py-5">

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 mb-3">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/rankings?tab=${t.key}&period=${period}`}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              tab === t.key
                ? "bg-accent text-white border-accent"
                : "bg-bg-card text-text-secondary border-border hover:text-text-primary"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Period toggle */}
      <div className="flex gap-1.5 mb-5">
        {PERIODS.map((p) => (
          <Link
            key={p.key}
            href={`/rankings?tab=${tab}&period=${p.key}`}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              period === p.key
                ? "bg-white/10 text-text-primary font-semibold"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      {error && (
        <div className="bg-[#2d0a0a] border border-[#5c1414] rounded-lg p-4 text-[#ff6b6b] text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Creator ranking */}
      {isCreatorTab && (
        <div className="flex flex-col gap-2.5">
          {creatorItems.map((item, idx) => (
            <div
              key={item.userId}
              className="flex items-center bg-bg-card border border-border rounded-[10px] py-3.5 px-4 gap-3.5"
            >
              <RankBadge idx={idx} />
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
              <div className="flex-1 min-w-0">
                <Link href={item.profileUrl} className="font-semibold text-[0.9375rem] text-text-primary">
                  {item.name}
                </Link>
                <div className="text-[0.8125rem] text-text-muted mt-0.5">
                  {item.handle}
                </div>
              </div>
              <div className="text-center text-[0.8125rem] text-text-secondary">
                <div className="font-semibold text-text-primary">{item.statCount}</div>
                <div>{statLabel}</div>
              </div>
              {viewerUserId && (
                <RankFollowButton
                  targetUserId={item.userId}
                  initialFollowing={item.isFollowing}
                  disabled={viewerUserId === item.userId}
                />
              )}
            </div>
          ))}
          {creatorItems.length === 0 && !error && (
            <EmptyState
              icon={<TrophyIcon size={20} weight="regular" />}
              title="暂无榜单数据"
              description="有新的统计数据后，这里会更新榜单内容。"
            />
          )}
        </div>
      )}

      {/* Video ranking */}
      {!isCreatorTab && (
        <div className="flex flex-col gap-2.5">
          {videoItems.map((item, idx) => (
            <Link
              key={item.videoId}
              href={item.detailUrl}
              className="flex items-center bg-bg-card border border-border rounded-[10px] py-3 px-4 gap-3.5 hover:border-border-hover transition-colors"
            >
              <RankBadge idx={idx} />
              <div className="relative shrink-0 w-20 aspect-video rounded-md overflow-hidden bg-black">
                {item.posterUrl ? (
                  <Image
                    src={item.posterUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">
                    暂无封面
                  </div>
                )}
                {item.durationText && (
                  <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[0.625rem] px-1 rounded">
                    {item.durationText}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[0.9375rem] text-text-primary line-clamp-1">
                  {item.title}
                </div>
                <div className="text-[0.8125rem] text-text-muted mt-0.5">
                  {item.author.name}
                </div>
              </div>
              <div className="text-center text-[0.8125rem] text-text-secondary shrink-0">
                <div className="font-semibold text-text-primary">{item.statCount}</div>
                <div>{statLabel}</div>
              </div>
            </Link>
          ))}
          {videoItems.length === 0 && !error && (
            <EmptyState
              icon={<TrophyIcon size={20} weight="regular" />}
              title="暂无榜单数据"
              description="有新的统计数据后，这里会更新榜单内容。"
            />
          )}
        </div>
      )}
    </div>
  );
}
