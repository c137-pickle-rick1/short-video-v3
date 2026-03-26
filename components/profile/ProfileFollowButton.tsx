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
      className={following ? "btn-secondary" : "btn-primary"}
      style={{ padding: "6px 20px", fontSize: "0.875rem" }}
    >
      {following ? "已关注" : "关注"}
    </button>
  );
}
