import { getDb } from "../../db";
import type { VideoFeedItem, VideoDetail, CommentItem, ViewerProfile } from "../../types";
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

type AuthorFields = { id: number; name: string | null; username: string | null; avatar_url: string | null };

export async function getVideoDetail(videoId: number, viewerUserId: number | null): Promise<VideoDetail | null> {
  const { data: row } = await getDb()
    .from("videos")
    .select(`
      id, origin, legacy_tweet_id, title, caption, description,
      poster_url, playback_url, hls_url, duration_text, duration_seconds,
      width, height, published_at, created_at,
      author:users!uploader_user_id(id, name, username, avatar_url)
    `)
    .eq("id", videoId)
    .eq("status", "published")
    .eq("visibility", "public")
    .single();

  if (!row) return null;

  const author = (row as unknown as { author: AuthorFields | null }).author;

  const [likesRes, bookmarksRes, commentsRes, viewsRes, isLikedRes, isBookmarkedRes, isFollowingAuthorRes, categoriesRes, tagsRes] = await Promise.all([
    getDb().from("video_likes").select("*", { count: "exact", head: true }).eq("video_id", videoId),
    getDb().from("video_bookmarks").select("*", { count: "exact", head: true }).eq("video_id", videoId),
    getDb().from("video_comments").select("*", { count: "exact", head: true }).eq("video_id", videoId).is("deleted_at", null),
    getDb().from("video_views").select("*", { count: "exact", head: true }).eq("video_id", videoId),
    viewerUserId
      ? getDb().from("video_likes").select("*", { count: "exact", head: true }).eq("video_id", videoId).eq("user_id", viewerUserId)
      : Promise.resolve({ count: 0 as number | null }),
    viewerUserId
      ? getDb().from("video_bookmarks").select("*", { count: "exact", head: true }).eq("video_id", videoId).eq("user_id", viewerUserId)
      : Promise.resolve({ count: 0 as number | null }),
    viewerUserId && author?.id
      ? getDb().from("user_follows").select("*", { count: "exact", head: true }).eq("follower_user_id", viewerUserId).eq("followed_user_id", author.id)
      : Promise.resolve({ count: 0 as number | null }),
    getDb().from("video_category_assignments").select("category:categories!category_id(id, slug, name)").eq("video_id", videoId),
    getDb().from("video_tag_assignments").select("tag:tags!tag_id(id, slug, name)").eq("video_id", videoId),
  ]);
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
      userId: author?.id ?? null,
      name: getDisplayName(author?.name ?? null, author?.username ?? null),
      imageUrl: normalizeAvatarUrl(author?.avatar_url ?? null, author?.name ?? null, author?.username ?? null),
      profileUrl: getProfileUrl(author?.username ?? null),
    },
    likeCount: likesRes.count ?? 0,
    bookmarkCount: bookmarksRes.count ?? 0,
    commentCount: commentsRes.count ?? 0,
    viewCount: viewsRes.count ?? 0,
    isLiked: (isLikedRes.count ?? 0) > 0,
    isBookmarked: (isBookmarkedRes.count ?? 0) > 0,
    isFollowingAuthor: (isFollowingAuthorRes.count ?? 0) > 0,
    categories: ((categoriesRes.data ?? []) as unknown as { category: { id: number; slug: string; name: string } | null }[])
      .map((r) => r.category)
      .filter((c): c is { id: number; slug: string; name: string } => c !== null),
    tags: ((tagsRes.data ?? []) as unknown as { tag: { id: number; slug: string; name: string } | null }[])
      .map((r) => r.tag)
      .filter((t): t is { id: number; slug: string; name: string } => t !== null),
  };
}

export async function getVideoComments(videoId: number): Promise<CommentItem[]> {
  const { data } = await getDb()
    .from("video_comments")
    .select(`
      id, body, created_at, edited_at, parent_id, reply_to_comment_id, user_id,
      author:users!user_id(name, username, avatar_url)
    `)
    .eq("video_id", videoId)
    .is("deleted_at", null)
    .order("id", { ascending: true });

  type CommentRow = {
    id: number;
    body: string;
    created_at: string;
    edited_at: string | null;
    parent_id: number | null;
    reply_to_comment_id: number | null;
    user_id: number;
    author: AuthorFields | null;
  };

  const mapRow = (row: CommentRow): CommentItem => ({
    id: row.id,
    body: row.body,
    createdAtText: formatRelativeTime(row.created_at),
    editedAtText: row.edited_at ? formatRelativeTime(row.edited_at) : null,
    parentId: row.parent_id,
    replyToCommentId: row.reply_to_comment_id,
    author: {
      name: getDisplayName(row.author?.name ?? null, row.author?.username ?? null),
      username: row.author?.username ?? "",
      imageUrl: normalizeAvatarUrl(row.author?.avatar_url ?? null, row.author?.name ?? null, row.author?.username ?? null),
      profileUrl: getProfileUrl(row.author?.username ?? null),
    },
  });

  const rows = (data ?? []) as unknown as CommentRow[];
  const topLevel = rows.filter((r) => r.parent_id === null).map(mapRow);
  const replies = rows.filter((r) => r.parent_id !== null).map(mapRow);

  for (const parent of topLevel) {
    parent.replies = replies.filter((r) => r.parentId === parent.id);
  }

  return topLevel;
}

export async function getRelatedVideos(videoId: number, limit = 8): Promise<VideoFeedItem[]> {
  const { data } = await getDb()
    .from("videos")
    .select(`
      id, origin, legacy_tweet_id, title, caption, description,
      poster_url, playback_url, hls_url, duration_text, duration_seconds,
      width, height, published_at, created_at,
      author:users!uploader_user_id(name, username, avatar_url)
    `)
    .neq("id", videoId)
    .eq("status", "published")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => {
    const author = (row as unknown as { author: AuthorFields | null }).author;
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
        name: getDisplayName(author?.name ?? null, author?.username ?? null),
        imageUrl: normalizeAvatarUrl(author?.avatar_url ?? null, author?.name ?? null, author?.username ?? null),
        profileUrl: getProfileUrl(author?.username ?? null),
      },
    };
  });
}

export async function getViewerProfile(userId: number): Promise<ViewerProfile | null> {
  const { data: row } = await getDb()
    .from("users")
    .select("id, name, username, email, bio, avatar_url")
    .eq("id", userId)
    .single();
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    bio: row.bio,
    avatarUrl: row.avatar_url,
  };
}


