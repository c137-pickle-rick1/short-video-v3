import { NextRequest, NextResponse } from "next/server";
import { registerLocalUser, getAuthCookieOptions, AUTH_SESSION_COOKIE_NAME, AuthValidationError } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, password, password_confirmation } = body;

    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const userAgent = request.headers.get("user-agent") ?? null;

    const result = await registerLocalUser(email, code, password, password_confirmation, { ipAddress, userAgent });

    const response = NextResponse.json({ ok: true, userId: result.userId });
    response.cookies.set(AUTH_SESSION_COOKIE_NAME, result.sessionToken, getAuthCookieOptions());
    return response;
  } catch (err) {
    if (err instanceof AuthValidationError) {
      return NextResponse.json({ ok: false, errors: err.errors, message: err.message }, { status: err.status });
    }
    console.error("[register]", err);
    return NextResponse.json({ ok: false, message: "服务器错误，请稍后再试。" }, { status: 500 });
  }
}
