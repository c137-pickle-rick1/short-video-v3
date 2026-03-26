import { NextRequest, NextResponse } from "next/server";
import { AUTH_SESSION_COOKIE_NAME, resolveViewerUserIdFromCookieToken } from "@/lib/server/auth";
import { recordVideoView } from "@/lib/server/mutations";
import { randomBytes } from "node:crypto";

export async function POST(request: NextRequest, { params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;
  const token = request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value;
  const viewerUserId = await resolveViewerUserIdFromCookieToken(token);

  // Use a persistent session ID from cookie, or generate ephemeral one
  let sessionId = request.cookies.get("sv_sid")?.value;
  const isNewSession = !sessionId;
  if (!sessionId) {
    sessionId = randomBytes(16).toString("hex");
  }

  try {
    await recordVideoView(viewerUserId, Number(videoId), sessionId);
    const response = NextResponse.json({ ok: true });
    if (isNewSession) {
      response.cookies.set("sv_sid", sessionId, {
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
        sameSite: "lax",
      });
    }
    return response;
  } catch (err) {
    console.error("[history POST]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
