"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  targetUserId: number;
  initialFollowing: boolean;
}

export default function ProfileFollowButton({ targetUserId, initialFollowing }: Props) {
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
      onClick={toggle}
      disabled={loading}
      className={following
        ? "inline-flex items-center gap-1.5 rounded-md border border-border-light bg-transparent px-5 py-1.5 text-sm font-medium text-text-secondary transition-all hover:border-text-muted hover:text-text-primary cursor-pointer"
        : "inline-flex items-center gap-1.5 rounded-md bg-accent px-5 py-1.5 text-sm font-semibold text-white border-none cursor-pointer transition-colors hover:bg-accent-hover"
      }
    >
      {following ? "已关注" : "关注"}
    </button>
  );
}
