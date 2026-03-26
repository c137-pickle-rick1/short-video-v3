"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="btn-secondary"
      style={{ padding: "8px 16px", fontSize: "0.875rem", color: "var(--color-danger, #e5192a)", cursor: loading ? "not-allowed" : "pointer" }}
    >
      {loading ? "退出中…" : "退出登录"}
    </button>
  );
}
