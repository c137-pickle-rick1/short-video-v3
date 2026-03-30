"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  videoId: string;
  initialLikes: number;
  initialLiked: boolean;
  initialBookmarked: boolean;
  viewerLoggedIn: boolean;
}

export default function VideoDetailReactions({ videoId, initialLikes, initialLiked, initialBookmarked, viewerLoggedIn }: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(initialLikes);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [likeLoading, setLikeLoading] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const router = useRouter();

  const toggleLike = async () => {
    if (!viewerLoggedIn) { router.push("/login"); return; }
    setLikeLoading(true);
    try {
      const res = await fetch(`/api/videos/${videoId}/likes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ like: !liked }),
      });
      if (res.status === 401) { router.push("/login"); return; }
      if (res.ok) {
        setLiked(!liked);
        setLikes(liked ? likes - 1 : likes + 1);
      }
    } finally {
      setLikeLoading(false);
    }
  };

  const toggleBookmark = async () => {
    if (!viewerLoggedIn) { router.push("/login"); return; }
    setBookmarkLoading(true);
    try {
      const res = await fetch(`/api/videos/${videoId}/bookmarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookmark: !bookmarked }),
      });
      if (res.status === 401) { router.push("/login"); return; }
      if (res.ok) setBookmarked(!bookmarked);
    } finally {
      setBookmarkLoading(false);
    }
  };

  return (
    <div className="flex gap-2 flex-wrap justify-center">
      <button
        onClick={toggleLike}
        disabled={likeLoading}
        className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-[7px] font-semibold text-[0.8125rem] border ${
          liked
            ? "bg-[rgba(229,25,42,0.15)] border-accent text-accent"
            : "bg-bg-card border-border text-text-secondary"
        } ${likeLoading ? "cursor-wait" : "cursor-pointer"}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        {likes > 0 && <span>{likes}</span>}
        <span>{liked ? "已点赞" : "点赞"}</span>
      </button>

      <button
        onClick={toggleBookmark}
        disabled={bookmarkLoading}
        className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-[7px] font-semibold text-[0.8125rem] border ${
          bookmarked
            ? "bg-[rgba(229,25,42,0.15)] border-accent text-accent"
            : "bg-bg-card border-border text-text-secondary"
        } ${bookmarkLoading ? "cursor-wait" : "cursor-pointer"}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
        <span>{bookmarked ? "已收藏" : "收藏"}</span>
      </button>
    </div>
  );
}
