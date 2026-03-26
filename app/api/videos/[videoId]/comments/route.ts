import { NextRequest, NextResponse } from "next/server";
import { AUTH_SESSION_COOKIE_NAME, resolveViewerUserIdFromCookieToken } from "@/lib/server/auth";
import { addComment } from "@/lib/server/mutations";
import { getVideoComments } from "@/lib/server/queries/video";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;

  try {
    const comments = await getVideoComments(Number(videoId));
    return NextResponse.json({ ok: true, comments });
  } catch (err) {
    console.error("[comments GET]", err);
    return NextResponse.json({ ok: false, message: "加载失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;
  const token = request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value;
  const viewerUserId = await resolveViewerUserIdFromCookieToken(token);

  if (!viewerUserId) {
    return NextResponse.json({ ok: false, message: "请先登录。" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { body: commentBody, parent_id, reply_to_comment_id } = body;

    const id = await addComment(
      viewerUserId,
      Number(videoId),
      commentBody,
      parent_id ?? null,
      reply_to_comment_id ?? null,
    );

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "操作失败";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
