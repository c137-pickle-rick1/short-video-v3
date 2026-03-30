import { getDb } from "../../db";
import type { Tag, VideoFeedItem } from "../../types";
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

const TAG_FEED_LIMIT = 24;

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

type TagRow = {
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

export async function getTags(): Promise<Tag[]> {
  const db = getDb();
  const [{ data: tags }, { data: counts }] = await Promise.all([
    db.from("tags")
      .select("id, slug, name, sort_order")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true }),
    db.from("video_tag_assignments").select("tag_id"),
  ]);

  if (!tags || tags.length === 0) return [];

  const countMap = new Map<number, number>();
  for (const row of (counts ?? []) as { tag_id: number }[]) {
    countMap.set(row.tag_id, (countMap.get(row.tag_id) ?? 0) + 1);
  }

  return (tags as TagRow[]).map((tag) => ({
      id: tag.id,
      slug: tag.slug,
      name: tag.name,
      sortOrder: tag.sort_order,
      videoCount: countMap.get(tag.id) ?? 0,
    }));
}

export async function getVideosByTag(
  slug: string,
  page = 1,
  sort: import("../queries/feed").ExploreFeedSortKey = "latest"
): Promise<{ items: VideoFeedItem[]; total: number; tag: { name: string; slug: string } | null }> {
  const { data: tag } = await getDb()
    .from("tags")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!tag) return { items: [], total: 0, tag: null };

  const { data: assignments, count } = await getDb()
    .from("video_tag_assignments")
    .select("video_id", { count: "exact" })
    .eq("tag_id", tag.id);

  if (!assignments || assignments.length === 0) {
    return { items: [], total: 0, tag: { name: tag.name, slug: tag.slug } };
  }

  const videoIds = (assignments as { video_id: number }[]).map((assignment) => assignment.video_id);
  const total = count ?? videoIds.length;

  if (sort === "latest") {
    const offset = (page - 1) * TAG_FEED_LIMIT;
    const { data: videos } = await getDb()
      .from("videos")
      .select(VIDEO_FEED_SELECT)
      .in("id", videoIds)
      .eq("status", "published")
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .range(offset, offset + TAG_FEED_LIMIT - 1);
    return {
      items: (videos ?? []).map((row) => mapRowToFeedItem(row as unknown as VideoRow)),
      total,
      tag: { name: tag.name, slug: tag.slug },
    };
  }

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

  const offset = (page - 1) * TAG_FEED_LIMIT;
  return {
    items: rows.slice(offset, offset + TAG_FEED_LIMIT).map(mapRowToFeedItem),
    total,
    tag: { name: tag.name, slug: tag.slug },
  };
}
