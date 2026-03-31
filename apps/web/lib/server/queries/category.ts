import { getDb } from "../../db";
import type { Category, CategoryGroup, VideoFeedItem } from "../../types";
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

type CategoryRow = {
  id: number;
  slug: string;
  name: string;
  group_id: number;
  sort_order: number;
};

type CategoryGroupRow = {
  id: number;
  slug: string;
  name: string;
  sort_order: number;
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

export async function getCategoryGroups(): Promise<CategoryGroup[]> {
  const db = getDb();
  const [{ data: groups }, { data: categories }, { data: counts }, { data: covers }] = await Promise.all([
    db.from("category_groups")
      .select("id, slug, name, sort_order")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true }),
    db.from("categories")
      .select("id, slug, name, group_id, sort_order")
      .order("group_id", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true }),
    db.from("video_category_assignments").select("category_id"),
    db.from("video_category_assignments")
      .select("category_id, video:videos!video_id(poster_url)")
      .order("created_at", { ascending: false }),
  ]);

  if (!groups || groups.length === 0 || !categories || categories.length === 0) return [];

  const countMap = new Map<number, number>();
  for (const row of (counts ?? []) as { category_id: number }[]) {
    countMap.set(row.category_id, (countMap.get(row.category_id) ?? 0) + 1);
  }

  const coverMap = new Map<number, string | null>();
  for (const row of (covers ?? []) as unknown as AssignmentWithPoster[]) {
    if (!coverMap.has(row.category_id) && row.video?.poster_url) {
      coverMap.set(row.category_id, row.video.poster_url);
    }
  }

  const itemsByGroup = new Map<number, Category[]>();
  for (const category of categories as CategoryRow[]) {
    const items = itemsByGroup.get(category.group_id) ?? [];
    items.push({
      id: category.id,
      slug: category.slug,
      name: category.name,
      groupId: category.group_id,
      sortOrder: category.sort_order,
      videoCount: countMap.get(category.id) ?? 0,
      coverUrl: coverMap.get(category.id) ?? null,
    });
    itemsByGroup.set(category.group_id, items);
  }

  return (groups as CategoryGroupRow[])
    .map((group) => ({
      id: group.id,
      slug: group.slug,
      name: group.name,
      sortOrder: group.sort_order,
      items: itemsByGroup.get(group.id) ?? [],
    }))
    .filter((group) => group.items.length > 0);
}

export async function getVideosByCategory(
  slug: string,
  page = 1,
  sort: import("../queries/feed").ExploreFeedSortKey = "latest"
): Promise<{ items: VideoFeedItem[]; total: number; category: { name: string; slug: string } | null }> {
  const { data: cat } = await getDb()
    .from("categories")
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
  const total = count ?? videoIds.length;

  if (sort === "latest") {
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
      total,
      category: { name: cat.name, slug: cat.slug },
    };
  }

  // For non-latest sorts, fetch all videos in category, sort in memory, paginate
  const selectStr = `${VIDEO_FEED_SELECT}, like_count:video_likes(count), bookmark_count:video_bookmarks(count), comment_count:video_comments(count)`;
  const { data: videos } = await getDb()
    .from("videos")
    .select(selectStr)
    .in("id", videoIds)
    .eq("status", "published")
    .eq("visibility", "public");

  type RowWithCounts = VideoRow & {
    like_count?: { count: number }[];
    bookmark_count?: { count: number }[];
    comment_count?: { count: number }[];
  };

  const rows = (videos ?? []) as unknown as RowWithCounts[];
  rows.sort((a, b) => {
    const getCount = (r: RowWithCounts) =>
      sort === "likes" ? (r.like_count?.[0]?.count ?? 0)
      : sort === "bookmarks" ? (r.bookmark_count?.[0]?.count ?? 0)
      : (r.comment_count?.[0]?.count ?? 0);
    return getCount(b) - getCount(a);
  });

  const offset = (page - 1) * CATEGORY_FEED_LIMIT;
  return {
    items: rows.slice(offset, offset + CATEGORY_FEED_LIMIT).map(mapRowToFeedItem),
    total,
    category: { name: cat.name, slug: cat.slug },
  };
}
