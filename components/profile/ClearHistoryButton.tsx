"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClearHistoryButton() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  const clear = async () => {
    if (!confirm("确定清空全部观看历史？")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/history", { method: "DELETE" });
      if (res.ok) { setDone(true); router.refresh(); }
    } finally {
      setLoading(false);
    }
  };

  if (done) return <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>已清空</span>;

  return (
    <button
      onClick={clear}
      disabled={loading}
      style={{
        padding: "6px 14px",
        fontSize: "0.8125rem",
        background: "transparent",
        border: "1px solid var(--border)",
        borderRadius: "6px",
        color: "var(--text-secondary)",
        cursor: loading ? "wait" : "pointer",
      }}
    >
      {loading ? "清空中…" : "清空历史"}
    </button>
  );
}
