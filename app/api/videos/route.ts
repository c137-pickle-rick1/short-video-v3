import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { cookies } from "next/headers";
import { resolveViewerUserIdFromCookieToken } from "@/lib/server/auth";
import { execute } from "@/lib/db";
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

  // Create video + upload job in a transaction
  try {
    await execute("begin");

    const videoResult = await execute<{ id: number; status: string }>(
      `insert into public.videos
        (origin, uploader_user_id, title, description, visibility, status, published_at)
       values ('manual_upload', $1, $2, $3, 'public', 'queued', null)
       returning id, status`,
      [viewerUserId, title, tags],
    );

    const createdVideo = videoResult.rows[0];

    if (!createdVideo) {
      await execute("rollback");
      return NextResponse.json({ error: "创建视频记录失败" }, { status: 500 });
    }

    await execute(
      `insert into public.video_upload_jobs
        (video_id, uploader_user_id, source_storage_disk, source_object_path,
         source_filename, source_content_type, source_size_bytes, status)
       values ($1, $2, 'supabase', $3, $4, $5, $6, 'queued')`,
      [
        createdVideo.id,
        viewerUserId,
        sourceObjectPath,
        sourceFilename,
        contentType,
        file.size,
      ],
    );

    await execute("commit");

    return NextResponse.json({
      id: createdVideo.id,
      status: createdVideo.status,
      title,
    });
  } catch (err) {
    await execute("rollback").catch(() => {});
    const message = err instanceof Error ? err.message : "服务器内部错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
