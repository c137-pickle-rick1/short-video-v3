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
      className={`inline-flex items-center gap-1.5 rounded-md border border-border-light bg-transparent px-4 py-2 text-sm font-medium text-[#e5192a] transition-all hover:border-text-muted ${loading ? "cursor-not-allowed" : "cursor-pointer"}`}
    >
      {loading ? "退出中…" : "退出登录"}
    </button>
  );
}
