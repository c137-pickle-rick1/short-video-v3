import { NextRequest, NextResponse } from "next/server";
import { AUTH_SESSION_COOKIE_NAME, resolveViewerUserIdFromCookieToken } from "@/lib/server/auth";
import { setLike } from "@/lib/server/mutations";

export async function POST(request: NextRequest, { params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;
  const token = request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value;
  const viewerUserId = await resolveViewerUserIdFromCookieToken(token);

  if (!viewerUserId) {
    return NextResponse.json({ ok: false, message: "请先登录。" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const liked = body.liked !== false;
    const result = await setLike(viewerUserId, Number(videoId), liked);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[likes]", err);
    return NextResponse.json({ ok: false, message: "操作失败" }, { status: 500 });
  }
}
