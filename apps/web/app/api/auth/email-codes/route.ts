import { NextRequest, NextResponse } from "next/server";
import { sendAuthEmailCode, AuthValidationError } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, purpose } = body;

    if (purpose !== "register" && purpose !== "password_reset") {
      return NextResponse.json({ ok: false, message: "无效的请求类型。" }, { status: 400 });
    }

    const payload = await sendAuthEmailCode(email, purpose);
    return NextResponse.json({ ok: true, ...payload });
  } catch (err) {
    if (err instanceof AuthValidationError) {
      return NextResponse.json({ ok: false, errors: err.errors, message: err.message }, { status: err.status });
    }
    console.error("[email-codes]", err);
    return NextResponse.json({ ok: false, message: "服务器错误，请稍后再试。" }, { status: 500 });
  }
}
