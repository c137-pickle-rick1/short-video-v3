"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { VideoFeedItem } from "@/lib/types";

export default function BookmarksGrid({ initialVideos }: { initialVideos: VideoFeedItem[] }) {
  const [videos, setVideos] = useState<VideoFeedItem[]>(initialVideos);
  const [removing, setRemoving] = useState<Set<string>>(new Set());

  async function handleUnbookmark(e: React.MouseEvent, videoId: string) {
    e.preventDefault();
    e.stopPropagation();
    setRemoving((prev) => new Set(prev).add(videoId));
    try {
      await fetch(`/api/videos/${videoId}/bookmarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookmarked: false }),
      });
      setVideos((prev) => prev.filter((v) => v.videoId !== videoId));
    } finally {
      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(videoId);
        return next;
      });
    }
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-16 text-text-muted text-base">
        暂无收藏
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {videos.map((video) => (
        <div key={video.videoId} className="relative">
          <Link
            href={video.detailUrl}
            className="video-card block bg-bg-card rounded-lg overflow-hidden border border-border transition-[border-color,transform] duration-150"
          >
            {/* Thumbnail */}
            <div className="relative pb-[100%] bg-[#111]">
              {video.media.posterUrl ? (
                <>
                  <Image
                    src={video.media.posterUrl}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover blur-[24px] scale-[1.15] opacity-60"
                    unoptimized
                    aria-hidden
                  />
                  <Image
                    src={video.media.posterUrl}
                    alt={video.displayText}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-contain"
                    unoptimized
                  />
                </>
              ) : (
                <div className="absolute inset-0 bg-bg-secondary flex items-center justify-center text-text-muted text-[2rem]">
                  ▶
                </div>
              )}

              {/* Unbookmark button */}
              <button
                onClick={(e) => handleUnbookmark(e, video.videoId)}
                disabled={removing.has(video.videoId)}
                title="取消收藏"
                className={`absolute top-1.5 left-1.5 bg-black/65 border-none rounded-full w-7 h-7 flex items-center justify-center shrink-0 z-10 transition-colors hover:bg-[rgba(233,28,120,0.85)] ${removing.has(video.videoId) ? "cursor-not-allowed opacity-50" : "cursor-pointer opacity-100"}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                  <path d="M9 3h6l1 1h4v2H4V4h4L9 3zm-3 5h12l-1 13H7L6 8zm3 2v9h1v-9H9zm4 0v9h1v-9h-1z" />
                </svg>
              </button>

              {/* Duration badge */}
              {video.media.durationText && (
                <span className="absolute bottom-1.5 right-1.5 bg-black/82 text-white text-[0.7rem] font-semibold px-[5px] py-px rounded-[3px] tracking-[0.3px]">
                  {video.media.durationText}
                </span>
              )}

              {/* Play overlay */}
              <div className="play-overlay absolute inset-0 bg-transparent flex items-center justify-center transition-colors duration-200">
                <span className="play-icon text-[2.5rem] opacity-0 transition-opacity duration-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  ▶
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="px-3 pt-2.5 pb-3">
              <p className="line-clamp-2 text-[0.9375rem] text-text-primary leading-[1.4] mb-2">
                {video.displayText}
              </p>
              <div className="flex items-center gap-1.5">
                <Image
                  src={video.author.imageUrl}
                  alt={video.author.name}
                  width={18}
                  height={18}
                  className="rounded-full object-cover w-[18px] h-[18px] shrink-0"
                  unoptimized
                />
                <span className="text-xs text-text-secondary overflow-hidden text-ellipsis whitespace-nowrap">
                  {video.author.name}
                </span>
                <span className="text-xs text-text-muted shrink-0">
                  · {video.postedAtText}
                </span>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}
