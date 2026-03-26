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
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: "400px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>找回密码</h1>

        {error && (
          <div style={{ background: "#2d0a0a", border: "1px solid #5c1414", borderRadius: "6px", padding: "0.75rem", marginBottom: "1rem", color: "#ff6b6b", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}

        {debugCode && (
          <div style={{ background: "#0a2d0a", border: "1px solid #145c14", borderRadius: "6px", padding: "0.75rem", marginBottom: "1rem", color: "#6bff6b", fontSize: "0.875rem" }}>
            [DEV] 验证码: <strong>{debugCode}</strong>
          </div>
        )}

        {step === "done" ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>密码重置成功！</p>
            <Link href="/login" className="btn-primary" style={{ display: "inline-flex", justifyContent: "center" }}>
              立即登录
            </Link>
          </div>
        ) : step === "email" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "6px" }}>注册邮箱</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
            </div>
            <button className="btn-primary" onClick={handleSendCode} disabled={sendingCode} style={{ width: "100%", justifyContent: "center", padding: "0.625rem", fontSize: "1rem" }}>
              {sendingCode ? "发送中..." : "发送验证码"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "6px" }}>验证码</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="6位验证码" maxLength={6} style={{ flex: 1 }} />
                <button type="button" className="btn-secondary" onClick={handleSendCode} disabled={cooldown > 0} style={{ flexShrink: 0, padding: "6px 12px", fontSize: "0.8125rem" }}>
                  {cooldown > 0 ? `${cooldown}s` : "重发"}
                </button>
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "6px" }}>新密码</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少8位" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "6px" }}>确认新密码</label>
              <input type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} placeholder="再次输入密码" />
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", justifyContent: "center", padding: "0.625rem", fontSize: "1rem" }}>
              {loading ? "重置中..." : "重置密码"}
            </button>
          </form>
        )}

        <p style={{ marginTop: "1.25rem", textAlign: "center", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          <Link href="/login" style={{ color: "var(--accent)" }}>返回登录</Link>
        </p>
      </div>
    </div>
  );
}
