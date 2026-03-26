"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  targetUserId: number;
  initialFollowing: boolean;
  disabled?: boolean;
}

export default function RankFollowButton({ targetUserId, initialFollowing, disabled }: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${targetUserId}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ following: !following }),
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
      onClick={disabled ? undefined : toggle}
      disabled={loading || disabled}
      style={{
        padding: "6px 16px",
        borderRadius: "18px",
        fontSize: "0.8125rem",
        fontWeight: 600,
        background: disabled ? "transparent" : following ? "transparent" : "var(--accent)",
        color: disabled ? "var(--text-muted)" : following ? "var(--text-secondary)" : "#fff",
        border: `1px solid ${disabled ? "var(--border)" : following ? "var(--border)" : "var(--accent)"}`,
        cursor: disabled ? "default" : loading ? "wait" : "pointer",
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {disabled ? "关注" : following ? "已关注" : "关注"}
    </button>
  );
}
