import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { resolveViewerUserIdFromCookieToken } from "@/lib/server/auth";
import { getDb } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const { videoId } = await params;
  const id = parseInt(videoId, 10);

  if (!id || id <= 0) {
    return NextResponse.json({ error: "无效的视频 ID" }, { status: 400 });
  }

  const jar = await cookies();
  const token = jar.get("sv_session")?.value ?? null;
  const viewerUserId = token ? await resolveViewerUserIdFromCookieToken(token) : null;

  if (!viewerUserId) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { data: video } = await getDb()
    .from("videos")
    .select(`
      id, status, title, playback_url, poster_url,
      job:video_upload_jobs!video_id(status, error_message)
    `)
    .eq("id", id)
    .eq("uploader_user_id", viewerUserId)
    .maybeSingle();

  if (!video) {
    return NextResponse.json({ error: "视频不存在" }, { status: 404 });
  }

  const job = Array.isArray(video.job) ? video.job[0] : video.job;

  return NextResponse.json({
    id: video.id,
    status: video.status,
    title: video.title,
    playbackUrl: video.playback_url,
    posterUrl: video.poster_url,
    jobStatus: job?.status ?? null,
    jobError: job?.error_message ?? null,
  });
}
