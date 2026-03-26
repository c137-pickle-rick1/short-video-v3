"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState<"email" | "code">("email");
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
        body: JSON.stringify({ email, purpose: "register" }),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.message);
        return;
      }

      if (data.debugCode) setDebugCode(data.debugCode);

      setCooldown(data.cooldownSeconds ?? 60);
      const timer = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) { clearInterval(timer); return 0; }
          return c - 1;
        });
      }, 1000);

      setStep("code");
    } catch {
      setError("网络错误，请稍后再试");
    } finally {
      setSendingCode(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password, password_confirmation: passwordConfirmation }),
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.message);
        return;
      }

      router.push("/me");
      router.refresh();
    } catch {
      setError("网络错误，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--text-primary)" }}>
          注册账号
        </h1>

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

        {step === "email" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "6px" }}>邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
              />
            </div>
            <button
              className="btn-primary"
              onClick={handleSendCode}
              disabled={sendingCode}
              style={{ width: "100%", justifyContent: "center", padding: "0.625rem", fontSize: "1rem", opacity: sendingCode ? 0.7 : 1 }}
            >
              {sendingCode ? "发送中..." : "发送验证码"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "6px" }}>邮箱验证码</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="6位数字验证码"
                  maxLength={6}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleSendCode}
                  disabled={cooldown > 0 || sendingCode}
                  style={{ flexShrink: 0, padding: "6px 12px", fontSize: "0.8125rem" }}
                >
                  {cooldown > 0 ? `${cooldown}s` : "重发"}
                </button>
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "6px" }}>密码</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少8位" autoComplete="new-password" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "6px" }}>确认密码</label>
              <input type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} placeholder="再次输入密码" autoComplete="new-password" />
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: "100%", justifyContent: "center", padding: "0.625rem", fontSize: "1rem", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "注册中..." : "完成注册"}
            </button>
          </form>
        )}

        <p style={{ marginTop: "1.25rem", textAlign: "center", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          已有账号？{" "}
          <Link href="/login" style={{ color: "var(--accent)" }}>立即登录</Link>
        </p>
      </div>
    </div>
  );
}
