import { getDb } from "../../db";
import type { VideoFeedItem, RankingItem } from "../../types";
import {
  formatDuration,
  formatRelativeTime,
  getDisplayName,
  getHandle,
  getProfileUrl,
  getVideoUrl,
  normalizeAvatarUrl,
  getVideoSummary,
  getFrameClass,
  getVideoMediaUrls,
  escapeSqlLikePattern,
} from "../presenters";

const HOME_FEED_LIMIT = 24;
const EXPLORE_FEED_LIMIT = 48;
const RANKING_LIMIT = 10;

export const EXPLORE_FEED_SORT_KEYS = ["latest", "likes", "bookmarks", "comments"] as const;
export type ExploreFeedSortKey = (typeof EXPLORE_FEED_SORT_KEYS)[number];

type VideoRow = {
  id: number;
  origin: string | null;
  legacy_tweet_id: string | null;
  title: string | null;
  caption: string | null;
  description: string | null;
  poster_url: string | null;
  playback_url: string | null;
  hls_url: string | null;
  duration_text: string | null;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  published_at: string | null;
  created_at: string | null;
  author: { id: number; name: string | null; username: string | null; avatar_url: string | null } | null;
};

const VIDEO_FEED_SELECT = `
  id, origin, legacy_tweet_id, title, caption, description,
  poster_url, playback_url, hls_url, duration_text, duration_seconds,
  width, height, published_at, created_at,
  author:users!uploader_user_id(id, name, username, avatar_url)
` as const;

function mapRowToFeedItem(row: VideoRow): VideoFeedItem {
  const mediaUrls = getVideoMediaUrls(row.origin, row.playback_url, row.hls_url);
  return {
    videoId: String(row.id),
    tweetId: row.legacy_tweet_id ?? "",
    displayText: getVideoSummary(row.title, row.caption, row.description),
    detailUrl: getVideoUrl(row.id),
    postedAtText: formatRelativeTime(row.published_at ?? row.created_at),
    media: {
      posterUrl: row.poster_url ?? "",
      videoUrl: mediaUrls.fallbackUrl,
      hlsUrl: mediaUrls.hlsUrl,
      durationText: row.duration_text || formatDuration(row.duration_seconds),
      frameClass: getFrameClass(row.width, row.height),
    },
    author: {
      name: getDisplayName(row.author?.name ?? null, row.author?.username ?? null),
      imageUrl: normalizeAvatarUrl(row.author?.avatar_url ?? null, row.author?.name ?? null, row.author?.username ?? null),
      profileUrl: getProfileUrl(row.author?.username ?? null),
    },
  };
}

export async function getHomeFeedItems(
  page = 1,
  sort: ExploreFeedSortKey = "latest"
): Promise<{ items: VideoFeedItem[]; total: number }> {
  // For latest sort, use efficient paginated query
  if (sort === "latest") {
    const offset = (page - 1) * HOME_FEED_LIMIT;
    const { data, count } = await getDb()
      .from("videos")
      .select(VIDEO_FEED_SELECT, { count: "exact" })
      .eq("status", "published")
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .range(offset, offset + HOME_FEED_LIMIT - 1);
    return {
      items: (data ?? []).map((row) => mapRowToFeedItem(row as unknown as VideoRow)),
      total: count ?? 0,
    };
  }

  // For other sorts, fetch a larger batch, sort in memory, then paginate
  const selectStr = `${VIDEO_FEED_SELECT}, like_count:video_likes(count), bookmark_count:video_bookmarks(count), comment_count:video_comments(count)`;
  const { data, count } = await getDb()
    .from("videos")
    .select(selectStr, { count: "exact" })
    .eq("status", "published")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(HOME_FEED_LIMIT * 20);

  type RowWithCounts = VideoRow & {
    like_count?: { count: number }[];
    bookmark_count?: { count: number }[];
    comment_count?: { count: number }[];
  };

  const rows = (data ?? []) as unknown as RowWithCounts[];
  rows.sort((a, b) => {
    const getCount = (r: RowWithCounts) =>
      sort === "likes" ? (r.like_count?.[0]?.count ?? 0)
      : sort === "bookmarks" ? (r.bookmark_count?.[0]?.count ?? 0)
      : (r.comment_count?.[0]?.count ?? 0);
    return getCount(b) - getCount(a);
  });

  const total = count ?? rows.length;
  const offset = (page - 1) * HOME_FEED_LIMIT;
  return {
    items: rows.slice(offset, offset + HOME_FEED_LIMIT).map(mapRowToFeedItem),
    total,
  };
}

export function normalizeExploreFeedSort(value: string | null | undefined): ExploreFeedSortKey {
  if (EXPLORE_FEED_SORT_KEYS.includes(value as ExploreFeedSortKey)) {
    return value as ExploreFeedSortKey;
  }
  return "latest";
}

export function normalizeFeedSearchQuery(value: string | null | undefined): string {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
}

export async function getExploreFeedItems(
  sort: ExploreFeedSortKey = "latest",
  searchQuery = "",
  page = 1
): Promise<{ items: VideoFeedItem[]; total: number }> {
  const normalized = normalizeFeedSearchQuery(searchQuery);
  const offset = (page - 1) * HOME_FEED_LIMIT;

  // For latest sort, use efficient paginated query
  if (sort === "latest") {
    let query = getDb()
      .from("videos")
      .select(VIDEO_FEED_SELECT, { count: "exact" })
      .eq("status", "published")
      .eq("visibility", "public");

    if (normalized !== "") {
      const escaped = escapeSqlLikePattern(normalized);
      query = query.or(`title.ilike.%${escaped}%,caption.ilike.%${escaped}%,description.ilike.%${escaped}%`);
    }

    const { data, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + HOME_FEED_LIMIT - 1);

    return {
      items: (data ?? []).map((row) => mapRowToFeedItem(row as unknown as VideoRow)),
      total: count ?? 0,
    };
  }

  // For other sorts, fetch a larger batch, sort in memory, then paginate
  const selectStr = `${VIDEO_FEED_SELECT}, like_count:video_likes(count), bookmark_count:video_bookmarks(count), comment_count:video_comments(count)`;

  let query = getDb()
    .from("videos")
    .select(selectStr, { count: "exact" })
    .eq("status", "published")
    .eq("visibility", "public");

  if (normalized !== "") {
    const escaped = escapeSqlLikePattern(normalized);
    query = query.or(`title.ilike.%${escaped}%,caption.ilike.%${escaped}%,description.ilike.%${escaped}%`);
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .limit(HOME_FEED_LIMIT * 20);

  type RowWithCounts = VideoRow & {
    like_count?: { count: number }[];
    bookmark_count?: { count: number }[];
    comment_count?: { count: number }[];
  };

  const rows = (data ?? []) as unknown as RowWithCounts[];
  rows.sort((a, b) => {
    const getCount = (r: RowWithCounts) =>
      sort === "likes" ? (r.like_count?.[0]?.count ?? 0)
      : sort === "bookmarks" ? (r.bookmark_count?.[0]?.count ?? 0)
      : (r.comment_count?.[0]?.count ?? 0);
    return getCount(b) - getCount(a);
  });

  const total = count ?? rows.length;
  return {
    items: rows.slice(offset, offset + HOME_FEED_LIMIT).map(mapRowToFeedItem),
    total,
  };
}

export async function getRankingItems(viewerUserId?: number | null): Promise<RankingItem[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await getDb()
    .from("videos")
    .select(`
      id, published_at, created_at,
      author:users!uploader_user_id(id, name, username, avatar_url)
    `)
    .eq("status", "published")
    .eq("visibility", "public");

  type Entry = {
    user: { id: number; name: string | null; username: string | null; avatar_url: string | null };
    totalVideos: number;
    count7d: number;
    lastPublishedAt: string | null;
    videoIds: number[];
  };

  const userMap = new Map<number, Entry>();

  for (const video of data ?? []) {
    const author = (video as unknown as { author: Entry["user"] | null }).author;
    if (!author) continue;
    if (!userMap.has(author.id)) {
      userMap.set(author.id, { user: author, totalVideos: 0, count7d: 0, lastPublishedAt: null, videoIds: [] });
    }
    const entry = userMap.get(author.id)!;
    entry.totalVideos++;
    entry.videoIds.push((video as unknown as { id: number }).id);
    const publishedAt = (video as unknown as { published_at: string | null; created_at: string | null }).published_at
      ?? (video as unknown as { created_at: string | null }).created_at;
    if (publishedAt && publishedAt >= sevenDaysAgo) entry.count7d++;
    if (!entry.lastPublishedAt || (publishedAt && publishedAt > entry.lastPublishedAt)) {
      entry.lastPublishedAt = publishedAt;
    }
  }

  const ranked = Array.from(userMap.values())
    .sort((a, b) => b.count7d - a.count7d || b.totalVideos - a.totalVideos)
    .slice(0, RANKING_LIMIT);

  // Batch-fetch follow status for the viewer
  let followedSet = new Set<number>();
  if (viewerUserId) {
    const targetIds = ranked.map((e) => e.user.id);
    const { data: followRows } = await getDb()
      .from("user_follows")
      .select("followed_user_id")
      .eq("follower_user_id", viewerUserId)
      .in("followed_user_id", targetIds);
    followedSet = new Set((followRows ?? []).map((r) => r.followed_user_id));
  }

  let viewedVideoSet = new Set<number>();
  if (viewerUserId) {
    const targetVideoIds = ranked.flatMap((entry) => entry.videoIds);
    if (targetVideoIds.length > 0) {
      const { data: viewRows } = await getDb()
        .from("video_views")
        .select("video_id")
        .eq("user_id", viewerUserId)
        .in("video_id", targetVideoIds)
        .limit(5000);
      viewedVideoSet = new Set((viewRows ?? []).map((r) => r.video_id));
    }
  }

  return ranked.map((entry, index): RankingItem => ({
    rank: index + 1,
    userId: entry.user.id,
    name: getDisplayName(entry.user.name, entry.user.username),
    username: entry.user.username ?? "",
    handle: getHandle(entry.user.username),
    imageUrl: normalizeAvatarUrl(entry.user.avatar_url, entry.user.name, entry.user.username),
    profileUrl: getProfileUrl(entry.user.username),
    publishedCount7d: String(entry.count7d),
    totalVideos: String(entry.totalVideos),
    unreadCount: entry.videoIds.reduce((count, id) => (viewedVideoSet.has(id) ? count : count + 1), 0),
    lastPublishedAtText: formatRelativeTime(entry.lastPublishedAt),
    isFollowing: followedSet.has(entry.user.id),
  }));
}
