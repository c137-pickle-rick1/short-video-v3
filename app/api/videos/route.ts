import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { cookies } from "next/headers";
import { resolveViewerUserIdFromCookieToken } from "@/lib/server/auth";
import { getDb } from "@/lib/db";
import { uploadSourceVideoToStorage, isAllowedVideoFile, getVideoSizeLimit } from "@/lib/server/storage";

const MAX_TITLE_LENGTH = 120;
const MAX_TAGS_LENGTH = 120;

export async function POST(request: Request) {
  // Auth check
  const jar = await cookies();
  const token = jar.get("sv_session")?.value ?? null;
  const viewerUserId = token ? await resolveViewerUserIdFromCookieToken(token) : null;

  if (!viewerUserId) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const file = formData.get("video");
  const title = String(formData.get("title") ?? "").trim().slice(0, MAX_TITLE_LENGTH);
  const tags = String(formData.get("tags") ?? "").trim().slice(0, MAX_TAGS_LENGTH) || null;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "请选择视频文件" }, { status: 400 });
  }

  if (!title) {
    return NextResponse.json({ error: "请填写视频标题" }, { status: 400 });
  }

  if (!isAllowedVideoFile(file)) {
    return NextResponse.json({ error: "不支持的视频格式，请上传 MP4、MOV、M4V 或 WEBM" }, { status: 400 });
  }

  if (file.size > getVideoSizeLimit()) {
    return NextResponse.json({ error: "视频文件不能超过 200MB" }, { status: 400 });
  }

  const ext = extname(file.name).toLowerCase() || ".mp4";
  const sourceFilename = `source${ext}`;
  const sourceObjectPath = `${viewerUserId}/${randomUUID()}/${sourceFilename}`;
  const contentType = file.type || "video/mp4";

  // Upload source file to storage first
  try {
    await uploadSourceVideoToStorage({ file, objectPath: sourceObjectPath, contentType });
  } catch (err) {
    const message = err instanceof Error ? err.message : "上传失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Create the video record first, then add the upload job.
  try {
    const db = getDb();

    const { data: createdVideo, error: videoError } = await db
      .from("videos")
      .insert({
        origin: "manual_upload",
        uploader_user_id: viewerUserId,
        title,
        description: tags,
        visibility: "public",
        status: "queued",
        published_at: null,
      })
      .select("id, status")
      .single();

    if (videoError || !createdVideo) {
      return NextResponse.json({ error: "创建视频记录失败" }, { status: 500 });
    }

    const { error: jobError } = await db
      .from("video_upload_jobs")
      .insert({
        video_id: createdVideo.id,
        uploader_user_id: viewerUserId,
        source_storage_disk: "supabase",
        source_object_path: sourceObjectPath,
        source_filename: sourceFilename,
        source_content_type: contentType,
        source_size_bytes: file.size,
        status: "queued",
      });

    if (jobError) {
      await db.from("videos").delete().eq("id", createdVideo.id);
      return NextResponse.json({ error: "创建上传任务失败" }, { status: 500 });
    }

    return NextResponse.json({
      id: createdVideo.id,
      status: createdVideo.status,
      title,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "服务器内部错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
