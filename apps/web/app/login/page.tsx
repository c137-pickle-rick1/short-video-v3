"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect_to") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.message ?? "登录失败");
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("网络错误，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-bg-card border border-border rounded-xl p-8">
        <h1 className="text-2xl font-bold mb-6 text-text-primary">
          登录
        </h1>

        {error && (
          <div className="bg-[#2d0a0a] border border-[#5c1414] rounded-md p-3 mb-4 text-[#ff6b6b] text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1.5">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
              required
              autoComplete="current-password"
            />
          </div>

          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-[0.8125rem] text-accent"
            >
              忘记密码？
            </Link>
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-accent px-5 py-2.5 text-base font-semibold text-white border-none cursor-pointer transition-colors hover:bg-accent-hover disabled:opacity-70"
            disabled={loading}
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-text-secondary">
          还没有账号？{" "}
          <Link href="/register" className="text-accent">
            立即注册
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
