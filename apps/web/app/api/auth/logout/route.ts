import { NextRequest, NextResponse } from "next/server";
import { AUTH_SESSION_COOKIE_NAME, destroySession } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value ?? "";

  try {
    await destroySession(token);
  } catch {
    // Ignore DB errors on logout
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
  });
  return response;
}
