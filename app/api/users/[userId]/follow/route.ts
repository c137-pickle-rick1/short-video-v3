import { NextRequest, NextResponse } from "next/server";
import { AUTH_SESSION_COOKIE_NAME, resolveViewerUserIdFromCookieToken } from "@/lib/server/auth";
import { setFollow } from "@/lib/server/mutations";

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const token = request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value;
  const viewerUserId = await resolveViewerUserIdFromCookieToken(token);

  if (!viewerUserId) {
    return NextResponse.json({ ok: false, message: "请先登录。" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const following = body.following !== false;
    const result = await setFollow(viewerUserId, Number(userId), following);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "操作失败";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
