import { NextRequest, NextResponse } from "next/server";
import { resetPassword, AuthValidationError } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, password, password_confirmation } = body;

    await resetPassword(email, code, password, password_confirmation);
    return NextResponse.json({ ok: true, message: "密码重置成功，请重新登录。" });
  } catch (err) {
    if (err instanceof AuthValidationError) {
      return NextResponse.json({ ok: false, errors: err.errors, message: err.message }, { status: err.status });
    }
    console.error("[password-reset]", err);
    return NextResponse.json({ ok: false, message: "服务器错误，请稍后再试。" }, { status: 500 });
  }
}
