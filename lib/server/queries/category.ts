import { getDb } from "../../db";
import type { Category, VideoFeedItem } from "../../types";
import {
  formatDuration,
  formatRelativeTime,
  getDisplayName,
  getProfileUrl,
  getVideoUrl,
  normalizeAvatarUrl,
  getVideoSummary,
  getFrameClass,
  getVideoMediaUrls,
} from "../presenters";

const CATEGORY_FEED_LIMIT = 24;

const VIDEO_FEED_SELECT = `
  id, origin, legacy_tweet_id, title, caption, description,
  poster_url, playback_url, hls_url, duration_text, duration_seconds,
  width, height, published_at, created_at,
  author:users!uploader_user_id(id, name, username, avatar_url)
` as const;

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

type AssignmentWithPoster = { category_id: number; video: { poster_url: string | null } | null };

export async function getCategoryList(): Promise<Category[]> {
  const { data: categories } = await getDb()
    .from("video_categories")
    .select("id, slug, name, group_key, sort_order")
    .order("sort_order", { ascending: true });

  if (!categories || categories.length === 0) return [];

  // Get video count per category
  const { data: counts } = await getDb()
    .from("video_category_assignments")
    .select("category_id");

  const countMap = new Map<number, number>();
  for (const row of (counts ?? []) as { category_id: number }[]) {
    countMap.set(row.category_id, (countMap.get(row.category_id) ?? 0) + 1);
  }

  // Get one cover poster per category (latest assignment)
  const { data: covers } = await getDb()
    .from("video_category_assignments")
    .select("category_id, video:videos!video_id(poster_url)")
    .order("created_at", { ascending: false });

  const coverMap = new Map<number, string | null>();
  for (const row of (covers ?? []) as unknown as AssignmentWithPoster[]) {
    if (!coverMap.has(row.category_id) && row.video?.poster_url) {
      coverMap.set(row.category_id, row.video.poster_url);
    }
  }

  return categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    groupKey: c.group_key,
    sortOrder: c.sort_order,
    videoCount: countMap.get(c.id) ?? 0,
    coverUrl: coverMap.get(c.id) ?? null,
  }));
}

export async function getVideosByCategory(
  slug: string,
  page = 1
): Promise<{ items: VideoFeedItem[]; total: number; category: { name: string; slug: string } | null }> {
  const { data: cat } = await getDb()
    .from("video_categories")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!cat) return { items: [], total: 0, category: null };

  const { data: assignments, count } = await getDb()
    .from("video_category_assignments")
    .select("video_id", { count: "exact" })
    .eq("category_id", cat.id);

  if (!assignments || assignments.length === 0) {
    return { items: [], total: 0, category: { name: cat.name, slug: cat.slug } };
  }

  const videoIds = (assignments as { video_id: number }[]).map((a) => a.video_id);
  const offset = (page - 1) * CATEGORY_FEED_LIMIT;

  const { data: videos } = await getDb()
    .from("videos")
    .select(VIDEO_FEED_SELECT)
    .in("id", videoIds)
    .eq("status", "published")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .range(offset, offset + CATEGORY_FEED_LIMIT - 1);

  return {
    items: (videos ?? []).map((row) => mapRowToFeedItem(row as unknown as VideoRow)),
    total: count ?? videoIds.length,
    category: { name: cat.name, slug: cat.slug },
  };
}

