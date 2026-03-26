import { NextRequest, NextResponse } from "next/server";
import { AUTH_SESSION_COOKIE_NAME, resolveViewerUserIdFromCookieToken } from "@/lib/server/auth";
import { updateProfile } from "@/lib/server/mutations";
import { getViewerProfile } from "@/lib/server/queries/video";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value;
  const viewerUserId = await resolveViewerUserIdFromCookieToken(token);

  if (!viewerUserId) {
    return NextResponse.json({ ok: false, message: "请先登录。" }, { status: 401 });
  }

  const profile = await getViewerProfile(viewerUserId);
  return NextResponse.json({ ok: true, profile });
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value;
  const viewerUserId = await resolveViewerUserIdFromCookieToken(token);

  if (!viewerUserId) {
    return NextResponse.json({ ok: false, message: "请先登录。" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, bio } = body;
    await updateProfile(viewerUserId, { name, bio });
    const profile = await getViewerProfile(viewerUserId);
    return NextResponse.json({ ok: true, profile });
  } catch (err) {
    console.error("[profile POST]", err);
    return NextResponse.json({ ok: false, message: "更新失败" }, { status: 500 });
  }
}
