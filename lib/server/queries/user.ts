import { getDb } from "../../db";
import type { PublicProfile, VideoFeedItem } from "../../types";
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
} from "../presenters";

type AuthorFields = { name: string | null; username: string | null; avatar_url: string | null };

export async function getPublicProfile(username: string, viewerUserId: number | null): Promise<PublicProfile | null> {
  const { data: profile } = await getDb()
    .from("users")
    .select("id, name, username, bio, avatar_url")
    .ilike("username", username)
    .single();

  if (!profile) return null;

  const [followersRes, followingRes, videoCountRes, isFollowingRes] = await Promise.all([
    getDb().from("user_follows").select("*", { count: "exact", head: true }).eq("followed_user_id", profile.id),
    getDb().from("user_follows").select("*", { count: "exact", head: true }).eq("follower_user_id", profile.id),
    getDb().from("videos").select("*", { count: "exact", head: true }).eq("uploader_user_id", profile.id).eq("status", "published").eq("visibility", "public"),
    viewerUserId
      ? getDb().from("user_follows").select("*", { count: "exact", head: true }).eq("follower_user_id", viewerUserId).eq("followed_user_id", profile.id)
      : Promise.resolve({ count: 0 as number | null }),
  ]);

  const { data: videoRows } = await getDb()
    .from("videos")
    .select("id, origin, legacy_tweet_id, title, caption, description, poster_url, playback_url, hls_url, duration_text, duration_seconds, width, height, published_at, created_at")
    .eq("uploader_user_id", profile.id)
    .eq("status", "published")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(24);

  const videos: VideoFeedItem[] = (videoRows ?? []).map((row) => {
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
        name: getDisplayName(profile.name, profile.username),
        imageUrl: normalizeAvatarUrl(profile.avatar_url, profile.name, profile.username),
        profileUrl: getProfileUrl(profile.username),
      },
    };
  });

  return {
    userId: profile.id,
    name: getDisplayName(profile.name, profile.username),
    username: profile.username ?? "",
    handle: getHandle(profile.username),
    bio: profile.bio ?? "",
    imageUrl: normalizeAvatarUrl(profile.avatar_url, profile.name, profile.username),
    followerCount: followersRes.count ?? 0,
    followingCount: followingRes.count ?? 0,
    videoCount: videoCountRes.count ?? 0,
    isFollowing: (isFollowingRes.count ?? 0) > 0,
    videos,
  };
}

export async function getViewerBookmarks(viewerUserId: number, page = 1, pageSize = 24): Promise<{ videos: VideoFeedItem[]; total: number }> {
  const offset = (page - 1) * pageSize;
  const { data, count } = await getDb()
    .from("video_bookmarks")
    .select(`
      created_at,
      videos!video_id(
        id, origin, legacy_tweet_id, title, caption, description,
        poster_url, playback_url, hls_url, duration_text, duration_seconds,
        width, height, published_at, created_at, status,
        author:users!uploader_user_id(name, username, avatar_url)
      )
    `, { count: "exact" })
    .eq("user_id", viewerUserId)
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  const results: VideoFeedItem[] = [];
  for (const row of data ?? []) {
    const video = row.videos as unknown as { id: number; origin: string | null; legacy_tweet_id: string | null; title: string | null; caption: string | null; description: string | null; poster_url: string | null; playback_url: string | null; hls_url: string | null; duration_text: string | null; duration_seconds: number | null; width: number | null; height: number | null; published_at: string | null; created_at: string | null; status: string; author: AuthorFields | null } | null;
    if (!video || video.status !== "published") continue;
    const mediaUrls = getVideoMediaUrls(video.origin, video.playback_url, video.hls_url);
    results.push({
      videoId: String(video.id),
      tweetId: video.legacy_tweet_id ?? "",
      displayText: getVideoSummary(video.title, video.caption, video.description),
      detailUrl: getVideoUrl(video.id),
      postedAtText: formatRelativeTime(video.published_at ?? video.created_at),
      media: {
        posterUrl: video.poster_url ?? "",
        videoUrl: mediaUrls.fallbackUrl,
        hlsUrl: mediaUrls.hlsUrl,
        durationText: video.duration_text || formatDuration(video.duration_seconds),
        frameClass: getFrameClass(video.width, video.height),
      },
      author: {
        name: getDisplayName(video.author?.name ?? null, video.author?.username ?? null),
        imageUrl: normalizeAvatarUrl(video.author?.avatar_url ?? null, video.author?.name ?? null, video.author?.username ?? null),
        profileUrl: getProfileUrl(video.author?.username ?? null),
      },
    });
  }
  return { videos: results, total: count ?? 0 };
}

export async function getViewerHistory(viewerUserId: number, page = 1, pageSize = 24): Promise<{ videos: VideoFeedItem[]; total: number }> {
  const { data } = await getDb()
    .from("video_views")
    .select(`
      video_id, view_date,
      videos!video_id(
        id, origin, legacy_tweet_id, title, caption, description,
        poster_url, playback_url, hls_url, duration_text, duration_seconds,
        width, height, published_at, created_at, status,
        author:users!uploader_user_id(name, username, avatar_url)
      )
    `)
    .eq("user_id", viewerUserId)
    .order("view_date", { ascending: false })
    .limit(500);

  type HistoryVideo = { id: number; origin: string | null; legacy_tweet_id: string | null; title: string | null; caption: string | null; description: string | null; poster_url: string | null; playback_url: string | null; hls_url: string | null; duration_text: string | null; duration_seconds: number | null; width: number | null; height: number | null; published_at: string | null; created_at: string | null; status: string; author: AuthorFields | null };

  const seen = new Set<number>();
  const results: VideoFeedItem[] = [];
  for (const row of data ?? []) {
    const video = row.videos as unknown as HistoryVideo | null;
    if (!video || video.status !== "published") continue;
    if (seen.has(row.video_id)) continue;
    seen.add(row.video_id);
    const mediaUrls = getVideoMediaUrls(video.origin, video.playback_url, video.hls_url);
    results.push({
      videoId: String(video.id),
      tweetId: video.legacy_tweet_id ?? "",
      displayText: getVideoSummary(video.title, video.caption, video.description),
      detailUrl: getVideoUrl(video.id),
      postedAtText: formatRelativeTime(video.published_at ?? video.created_at),
      media: {
        posterUrl: video.poster_url ?? "",
        videoUrl: mediaUrls.fallbackUrl,
        hlsUrl: mediaUrls.hlsUrl,
        durationText: video.duration_text || formatDuration(video.duration_seconds),
        frameClass: getFrameClass(video.width, video.height),
      },
      author: {
        name: getDisplayName(video.author?.name ?? null, video.author?.username ?? null),
        imageUrl: normalizeAvatarUrl(video.author?.avatar_url ?? null, video.author?.name ?? null, video.author?.username ?? null),
        profileUrl: getProfileUrl(video.author?.username ?? null),
      },
    });
  }
  const total = results.length;
  const start = (page - 1) * pageSize;
  return { videos: results.slice(start, start + pageSize), total };
}

export interface MyUploadedVideo {
  id: number;
  title: string | null;
  status: string;
  posterUrl: string | null;
  createdAt: string | null;
}

export async function getMyVideos(viewerUserId: number): Promise<MyUploadedVideo[]> {
  const { data } = await getDb()
    .from("videos")
    .select("id, title, status, poster_url, created_at")
    .eq("uploader_user_id", viewerUserId)
    .eq("origin", "manual_upload")
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    posterUrl: r.poster_url,
    createdAt: r.created_at,
  }));
}

export async function getViewerFollowStats(viewerUserId: number): Promise<{ followingCount: number; followerCount: number }> {
  const [followingRes, followerRes] = await Promise.all([
    getDb().from("user_follows").select("*", { count: "exact", head: true }).eq("follower_user_id", viewerUserId),
    getDb().from("user_follows").select("*", { count: "exact", head: true }).eq("followed_user_id", viewerUserId),
  ]);

  return {
    followingCount: followingRes.count ?? 0,
    followerCount: followerRes.count ?? 0,
  };
}
