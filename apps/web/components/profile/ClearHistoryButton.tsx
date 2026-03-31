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

  if (done) return <span className="text-sm text-text-muted">已清空</span>;

  return (
    <button
      onClick={clear}
      disabled={loading}
      className={`py-1.5 px-3.5 text-[0.8125rem] bg-transparent border border-border rounded-md text-text-secondary ${loading ? "cursor-wait" : "cursor-pointer"}`}
    >
      {loading ? "清空中…" : "清空历史"}
    </button>
  );
}
