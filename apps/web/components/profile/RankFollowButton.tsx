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
      className={`py-1.5 px-4 rounded-[18px] text-[0.8125rem] font-semibold shrink-0 border ${
        disabled
          ? "bg-transparent text-text-muted border-border cursor-default opacity-50"
          : following
            ? "bg-transparent text-text-secondary border-border cursor-pointer"
            : "bg-accent text-white border-accent cursor-pointer"
      } ${loading ? "cursor-wait" : ""}`}
    >
      {disabled ? "关注" : following ? "已关注" : "关注"}
    </button>
  );
}
