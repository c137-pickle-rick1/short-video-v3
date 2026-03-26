import Link from "next/link";
import Image from "next/image";
import type { VideoFeedItem } from "@/lib/types";

interface VideoCardProps {
  video: VideoFeedItem;
  showAuthor?: boolean;
  eagerPoster?: boolean;
}

export default function VideoCard({ video, showAuthor = true, eagerPoster = false }: VideoCardProps) {
  return (
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
            {/* Blurred background layer */}
            <Image
              src={video.media.posterUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              loading={eagerPoster ? "eager" : "lazy"}
              style={{ objectFit: "cover", filter: "blur(24px)", transform: "scale(1.15)", opacity: 0.6 }}
              unoptimized
              aria-hidden
            />
            {/* Foreground image */}
            <Image
              src={video.media.posterUrl}
              alt={video.displayText}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              loading={eagerPoster ? "eager" : "lazy"}
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
          style={{
            fontSize: "0.9375rem",
            color: "var(--text-primary)",
            lineHeight: "1.4",
            marginBottom: showAuthor ? "8px" : 0,
          }}
        >
          {video.displayText}
        </p>

        {showAuthor && (
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
        )}
      </div>

      <style>{`
        .video-card:hover {
          border-color: var(--accent);
          box-shadow: 0 0 0 1px var(--accent), 0 4px 16px rgba(233, 28, 120, 0.18);
          transform: translateY(-2px);
        }
        .video-card:hover .play-overlay {
          background: rgba(0,0,0,0.3) !important;
        }
        .video-card:hover .play-icon {
          opacity: 1 !important;
          color: var(--accent);
        }
      `}</style>
    </Link>
  );
}
