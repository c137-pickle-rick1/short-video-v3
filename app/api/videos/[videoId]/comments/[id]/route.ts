import { NextRequest, NextResponse } from "next/server";
import { AUTH_SESSION_COOKIE_NAME, resolveViewerUserIdFromCookieToken } from "@/lib/server/auth";
import { deleteComment } from "@/lib/server/mutations";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ videoId: string; id: string }> }) {
  const { id } = await params;
  const token = request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value;
  const viewerUserId = await resolveViewerUserIdFromCookieToken(token);

  if (!viewerUserId) {
    return NextResponse.json({ ok: false, message: "请先登录。" }, { status: 401 });
  }

  try {
    await deleteComment(viewerUserId, Number(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[comment DELETE]", err);
    return NextResponse.json({ ok: false, message: "操作失败" }, { status: 500 });
  }
}
