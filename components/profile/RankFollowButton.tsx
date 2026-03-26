"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  targetUserId: number;
  initialFollowing: boolean;
}

export default function RankFollowButton({ targetUserId, initialFollowing }: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${targetUserId}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ follow: !following }),
      });
      if (res.status === 401) { router.push("/login"); return; }
      if (res.ok) {
        setFollowing(!following);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        padding: "6px 16px",
        borderRadius: "18px",
        fontSize: "0.8125rem",
        fontWeight: 600,
        background: following ? "transparent" : "var(--accent)",
        color: following ? "var(--text-secondary)" : "#fff",
        border: `1px solid ${following ? "var(--border)" : "var(--accent)"}`,
        cursor: loading ? "wait" : "pointer",
        flexShrink: 0,
      }}
    >
      {following ? "已关注" : "关注"}
    </button>
  );
}
