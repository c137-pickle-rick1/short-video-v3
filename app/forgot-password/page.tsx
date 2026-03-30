"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "code" | "done">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  async function handleSendCode() {
    if (!email.trim()) { setError("请输入邮箱"); return; }
    setSendingCode(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/email-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "password_reset" }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.message); return; }
      if (data.debugCode) setDebugCode(data.debugCode);
      setCooldown(data.cooldownSeconds ?? 60);
      const timer = setInterval(() => {
        setCooldown((c) => { if (c <= 1) { clearInterval(timer); return 0; } return c - 1; });
      }, 1000);
      setStep("code");
    } catch {
      setError("网络错误，请稍后再试");
    } finally {
      setSendingCode(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password, password_confirmation: passwordConfirmation }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.message); return; }
      setStep("done");
    } catch {
      setError("网络错误，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-bg-card border border-border rounded-xl p-8">
        <h1 className="text-2xl font-bold mb-6">找回密码</h1>

        {error && (
          <div className="bg-[#2d0a0a] border border-[#5c1414] rounded-md p-3 mb-4 text-[#ff6b6b] text-sm">
            {error}
          </div>
        )}

        {debugCode && (
          <div className="bg-[#0a2d0a] border border-[#145c14] rounded-md p-3 mb-4 text-[#6bff6b] text-sm">
            [DEV] 验证码: <strong>{debugCode}</strong>
          </div>
        )}

        {step === "done" ? (
          <div className="text-center">
            <p className="text-text-secondary mb-4">密码重置成功！</p>
            <Link href="/login" className="inline-flex justify-center items-center gap-1.5 rounded-md bg-accent px-5 py-2 font-semibold text-white transition-colors hover:bg-accent-hover">
              立即登录
            </Link>
          </div>
        ) : step === "email" ? (
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">注册邮箱</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
            </div>
            <button className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-accent px-5 py-2.5 text-base font-semibold text-white border-none cursor-pointer transition-colors hover:bg-accent-hover disabled:opacity-70" onClick={handleSendCode} disabled={sendingCode}>
              {sendingCode ? "发送中..." : "发送验证码"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">验证码</label>
              <div className="flex gap-2">
                <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="6位验证码" maxLength={6} className="flex-1" />
                <button type="button" className="shrink-0 inline-flex items-center gap-1.5 rounded-md border border-border-light bg-transparent px-3 py-1.5 text-[0.8125rem] font-medium text-text-secondary cursor-pointer transition-all hover:border-text-muted hover:text-text-primary disabled:opacity-50" onClick={handleSendCode} disabled={cooldown > 0}>
                  {cooldown > 0 ? `${cooldown}s` : "重发"}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">新密码</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少8位" />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">确认新密码</label>
              <input type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} placeholder="再次输入密码" />
            </div>
            <button type="submit" className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-accent px-5 py-2.5 text-base font-semibold text-white border-none cursor-pointer transition-colors hover:bg-accent-hover disabled:opacity-70" disabled={loading}>
              {loading ? "重置中..." : "重置密码"}
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-text-secondary">
          <Link href="/login" className="text-accent">返回登录</Link>
        </p>
      </div>
    </div>
  );
}
