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
      <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)", fontSize: "1rem" }}>
        暂无收藏
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "12px" }} className="video-grid">
      {videos.map((video) => (
        <div key={video.videoId} style={{ position: "relative" }}>
          <Link
            href={video.detailUrl}
            style={{
              display: "block",
              background: "var(--bg-card)",
              borderRadius: "8px",
              overflow: "hidden",
              border: "1px solid var(--border)",
              transition: "border-color 0.15s, transform 0.15s",
            }}
            className="video-card"
          >
            {/* Thumbnail */}
            <div style={{ position: "relative", paddingBottom: "100%", background: "#111" }}>
              {video.media.posterUrl ? (
                <>
                  <Image
                    src={video.media.posterUrl}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    style={{ objectFit: "cover", filter: "blur(24px)", transform: "scale(1.15)", opacity: 0.6 }}
                    unoptimized
                    aria-hidden
                  />
                  <Image
                    src={video.media.posterUrl}
                    alt={video.displayText}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    style={{ objectFit: "contain" }}
                    unoptimized
                  />
                </>
              ) : (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "var(--bg-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                    fontSize: "2rem",
                  }}
                >
                  ▶
                </div>
              )}

              {/* Unbookmark button */}
              <button
                onClick={(e) => handleUnbookmark(e, video.videoId)}
                disabled={removing.has(video.videoId)}
                title="取消收藏"
                style={{
                  position: "absolute",
                  top: "6px",
                  left: "6px",
                  background: "rgba(0,0,0,0.65)",
                  border: "none",
                  borderRadius: "50%",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: removing.has(video.videoId) ? "not-allowed" : "pointer",
                  opacity: removing.has(video.videoId) ? 0.5 : 1,
                  transition: "background 0.15s, opacity 0.15s",
                  flexShrink: 0,
                  zIndex: 10,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(233,28,120,0.85)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.65)";
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#fff" }}>
                  <path d="M9 3h6l1 1h4v2H4V4h4L9 3zm-3 5h12l-1 13H7L6 8zm3 2v9h1v-9H9zm4 0v9h1v-9h-1z" />
                </svg>
              </button>

              {/* Duration badge */}
              {video.media.durationText && (
                <span
                  style={{
                    position: "absolute",
                    bottom: "6px",
                    right: "6px",
                    background: "rgba(0,0,0,0.82)",
                    color: "#fff",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    padding: "1px 5px",
                    borderRadius: "3px",
                    letterSpacing: "0.3px",
                  }}
                >
                  {video.media.durationText}
                </span>
              )}

              {/* Play overlay */}
              <div
                className="play-overlay"
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.2s",
                }}
              >
                <span
                  className="play-icon"
                  style={{
                    fontSize: "2.5rem",
                    opacity: 0,
                    transition: "opacity 0.2s",
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.8))",
                  }}
                >
                  ▶
                </span>
              </div>
            </div>

            {/* Info */}
            <div style={{ padding: "10px 12px 12px" }}>
              <p
                className="line-clamp-2"
                style={{ fontSize: "0.9375rem", color: "var(--text-primary)", lineHeight: "1.4", marginBottom: "8px" }}
              >
                {video.displayText}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Image
                  src={video.author.imageUrl}
                  alt={video.author.name}
                  width={18}
                  height={18}
                  style={{ borderRadius: "50%", objectFit: "cover", width: 18, height: 18, flexShrink: 0 }}
                  unoptimized
                />
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {video.author.name}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", flexShrink: 0 }}>
                  · {video.postedAtText}
                </span>
              </div>
            </div>
          </Link>
        </div>
      ))}

      <style>{`
        .video-grid { grid-template-columns: repeat(2, 1fr); }
        @media (min-width: 640px) { .video-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1024px) { .video-grid { grid-template-columns: repeat(4, 1fr); } }
        .video-card:hover {
          border-color: var(--accent);
          box-shadow: 0 0 0 1px var(--accent), 0 4px 16px rgba(233,28,120,0.18);
          transform: translateY(-2px);
        }
        .video-card:hover .play-overlay { background: rgba(0,0,0,0.32) !important; }
        .video-card:hover .play-icon { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
