"use client";

import { useEffect, useRef } from "react";
import type { VideoDetail } from "@/lib/types";

interface Props {
  video: VideoDetail;
}

export default function VideoPlayer({ video }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const plyrRef = useRef<import("plyr") | null>(null);

  const frameClass = video.media.frameClass;
  const playerRatio = "1 / 1";
  const maxWidthByRatio = "100%";

  // Twitter CDN (twimg.com) blocks requests with a Referer header.
  // Prefer the direct MP4 URL for those; fall back to HLS for self-hosted content.
  const isTwitterUrl = (url: string) => url.includes("twimg.com");
  const src =
    isTwitterUrl(video.media.videoUrl || video.media.hlsUrl)
      ? video.media.videoUrl || video.media.hlsUrl
      : video.media.hlsUrl || video.media.videoUrl;
  const playbackSrc = isTwitterUrl(src)
    ? `/api/media/proxy?url=${encodeURIComponent(src)}`
    : src;

  useEffect(() => {
    let instance: import("plyr") | null = null;

    (async () => {
      const Plyr = (await import("plyr")).default;
      await import("plyr/dist/plyr.css");

      if (!videoRef.current) return;

      instance = new Plyr(videoRef.current, {
        controls: [
          "play-large",
          "play",
          "progress",
          "current-time",
          "mute",
          "volume",
          "fullscreen",
        ],
        ratio: frameClass === "landscape" ? "16:9" : frameClass === "portrait" ? "9:16" : "1:1",
        i18n: {
          play: "播放",
          pause: "暂停",
          mute: "静音",
          unmute: "取消静音",
          fullscreen: "全屏",
          exitFullscreen: "退出全屏",
        },
      });

      plyrRef.current = instance;
    })();

    return () => {
      instance?.destroy();
      plyrRef.current = null;
    };
  }, [frameClass]);

  return (
    <div
      className="video-player-shell"
      style={{
        position: "relative",
        background: "#000",
        borderRadius: "10px",
        overflow: "hidden",
        width: "100%",
        maxWidth: maxWidthByRatio,
        margin: "0 auto",
        aspectRatio: playerRatio,
        maxHeight: "75vh",
      }}
    >
      {video.media.posterUrl ? (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${video.media.posterUrl})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
            filter: "blur(36px) saturate(1.15)",
            transform: "scale(1.15)",
            opacity: 0.78,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      ) : null}
      <video
        ref={videoRef}
        src={playbackSrc}
        poster={video.media.posterUrl || undefined}
        preload="metadata"
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "contain", position: "relative", zIndex: 1, background: "transparent" }}
      />

      <style jsx global>{`
        .video-player-shell .plyr {
          position: relative;
          z-index: 1;
          height: 100%;
        }
        .video-player-shell .plyr__video-wrapper {
          background: transparent !important;
          width: 100% !important;
          height: 100% !important;
        }
        .video-player-shell .plyr__video-wrapper--fixed-ratio {
          aspect-ratio: auto !important;
        }
        .video-player-shell .plyr__poster {
          background-color: transparent !important;
        }
      `}</style>
    </div>
  );
}
