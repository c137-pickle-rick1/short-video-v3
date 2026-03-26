import { getDb } from "../db";

export async function clearHistory(viewerUserId: number) {
  const { data } = await getDb()
    .from("video_views")
    .delete()
    .eq("user_id", viewerUserId)
    .select("id");
  return { deletedCount: (data ?? []).length };
}

export async function removeHistoryItem(viewerUserId: number, videoId: number) {
  const { data } = await getDb()
    .from("video_views")
    .delete()
    .eq("user_id", viewerUserId)
    .eq("video_id", videoId)
    .select("id");
  return { deletedCount: (data ?? []).length };
}

export async function setBookmark(viewerUserId: number, videoId: number, bookmarked: boolean) {
  if (bookmarked) {
    await getDb()
      .from("video_bookmarks")
      .upsert({ user_id: viewerUserId, video_id: videoId }, { ignoreDuplicates: true });
  } else {
    await getDb()
      .from("video_bookmarks")
      .delete()
      .eq("user_id", viewerUserId)
      .eq("video_id", videoId);
  }

  const { count } = await getDb()
    .from("video_bookmarks")
    .select("*", { count: "exact", head: true })
    .eq("video_id", videoId);

  return { bookmarkCount: count ?? 0, bookmarked };
}

export async function setLike(viewerUserId: number, videoId: number, liked: boolean) {
  if (liked) {
    await getDb()
      .from("video_likes")
      .upsert({ user_id: viewerUserId, video_id: videoId }, { ignoreDuplicates: true });
  } else {
    await getDb()
      .from("video_likes")
      .delete()
      .eq("user_id", viewerUserId)
      .eq("video_id", videoId);
  }

  const { count } = await getDb()
    .from("video_likes")
    .select("*", { count: "exact", head: true })
    .eq("video_id", videoId);

  return { likeCount: count ?? 0, liked };
}

export async function setFollow(viewerUserId: number, targetUserId: number, following: boolean) {
  if (viewerUserId === targetUserId) throw new Error("Cannot follow self");

  if (following) {
    await getDb()
      .from("user_follows")
      .upsert({ follower_user_id: viewerUserId, followed_user_id: targetUserId }, { ignoreDuplicates: true });
  } else {
    await getDb()
      .from("user_follows")
      .delete()
      .eq("follower_user_id", viewerUserId)
      .eq("followed_user_id", targetUserId);
  }

  const [targetFollowerRes, viewerFollowingRes] = await Promise.all([
    getDb().from("user_follows").select("*", { count: "exact", head: true }).eq("followed_user_id", targetUserId),
    getDb().from("user_follows").select("*", { count: "exact", head: true }).eq("follower_user_id", viewerUserId),
  ]);

  return {
    following,
    targetFollowerCount: targetFollowerRes.count ?? 0,
    viewerFollowingCount: viewerFollowingRes.count ?? 0,
  };
}

export async function recordVideoView(viewerUserId: number | null, videoId: number, sessionId: string) {
  await getDb()
    .from("video_views")
    .upsert(
      {
        video_id: videoId,
        user_id: viewerUserId,
        session_id: sessionId,
        view_date: new Date().toISOString().split("T")[0],
      },
      { ignoreDuplicates: true, onConflict: "video_id,session_id,view_date" },
    );
}

export async function addComment(
  viewerUserId: number,
  videoId: number,
  body: string,
  parentId: number | null = null,
  replyToCommentId: number | null = null,
) {
  const trimmedBody = body.trim();
  if (trimmedBody === "") throw new Error("Comment body cannot be empty");
  if (trimmedBody.length > 2000) throw new Error("Comment too long");

  const { data } = await getDb()
    .from("video_comments")
    .insert({
      video_id: videoId,
      user_id: viewerUserId,
      parent_id: parentId,
      reply_to_comment_id: replyToCommentId,
      body: trimmedBody,
    })
    .select("id")
    .single();

  return data?.id ?? null;
}

export async function deleteComment(viewerUserId: number, commentId: number) {
  await getDb()
    .from("video_comments")
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("user_id", viewerUserId)
    .is("deleted_at", null);
}

export async function updateProfile(
  viewerUserId: number,
  data: { name?: string; bio?: string; avatarUrl?: string },
) {
  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) updates.name = data.name.trim().slice(0, 100);
  if (data.bio !== undefined) updates.bio = data.bio.trim().slice(0, 500);
  if (data.avatarUrl !== undefined) updates.avatar_url = data.avatarUrl;
  if (Object.keys(updates).length === 0) return;
  updates.updated_at = new Date().toISOString();

  await getDb()
    .from("users")
    .update(updates)
    .eq("id", viewerUserId);
}

export async function getCurrentAvatarUrl(viewerUserId: number) {
  const { data } = await getDb()
    .from("users")
    .select("avatar_url")
    .eq("id", viewerUserId)
    .single();
  return data?.avatar_url ?? null;
}


