import { NextRequest, NextResponse } from "next/server";
import { AUTH_SESSION_COOKIE_NAME, resolveViewerUserIdFromCookieToken } from "./lib/server/auth";

const PROTECTED_PATHS = ["/me"];
const PROTECTED_API_PATHS = ["/api/profile", "/api/history"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isProtectedApiPath(pathname: string): boolean {
  return PROTECTED_API_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname) && !isProtectedApiPath(pathname)) {
    return NextResponse.next();
  }

  let viewerUserId: number | null = null;

  try {
    const token = request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value;
    viewerUserId = await resolveViewerUserIdFromCookieToken(token);
  } catch {
    // DB not configured or error — treat as signed out
  }

  if (!viewerUserId) {
    if (isProtectedApiPath(pathname)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect_to", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  response.headers.set("x-viewer-user-id", String(viewerUserId));
  return response;
}

export const config = {
  matcher: ["/me/:path*", "/api/profile/:path*", "/api/history/:path*"],
};
