import { NextRequest, NextResponse } from "next/server";
import { AUTH_SESSION_COOKIE_NAME, resolveViewerUserIdFromCookieToken } from "@/lib/server/auth";
import { updateProfile } from "@/lib/server/mutations";
import { getViewerProfile } from "@/lib/server/queries/video";
import { uploadAvatarToStorage } from "@/lib/server/storage";

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
    const contentType = request.headers.get("content-type") ?? "";
    let name: string | undefined;
    let bio: string | undefined;
    let avatarUrl: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      name = (form.get("name") as string | null) ?? undefined;
      bio = (form.get("bio") as string | null) ?? undefined;

      const avatarFile = form.get("avatar");
      if (avatarFile instanceof File && avatarFile.size > 0) {
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(avatarFile.type)) {
          return NextResponse.json({ ok: false, message: "头像仅支持 JPG/PNG/WEBP" }, { status: 400 });
        }
        if (avatarFile.size > 5 * 1024 * 1024) {
          return NextResponse.json({ ok: false, message: "头像不能超过 5MB" }, { status: 400 });
        }

        const ext = avatarFile.type === "image/png" ? "png" : avatarFile.type === "image/webp" ? "webp" : "jpg";
        const objectPath = `${viewerUserId}/${crypto.randomUUID()}.${ext}`;
        avatarUrl = await uploadAvatarToStorage({ userId: viewerUserId, file: avatarFile, objectPath });
      }
    } else {
      const body = await request.json();
      name = body.name;
      bio = body.bio;
    }

    await updateProfile(viewerUserId, { name, bio, avatarUrl });
    const profile = await getViewerProfile(viewerUserId);
    return NextResponse.json({ ok: true, profile });
  } catch (err) {
    console.error("[profile POST]", err);
    return NextResponse.json({ ok: false, message: "更新失败" }, { status: 500 });
  }
}
