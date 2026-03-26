"use client";

import { useEffect, useRef } from "react";
import { useMemo, useState } from "react";
import type { VideoDetail } from "@/lib/types";

interface Props {
  video: VideoDetail;
}

export default function VideoPlayer({ video }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const plyrRef = useRef<import("plyr") | null>(null);

  const frameClass = video.media.frameClass;
  const initialRatio = frameClass === "landscape" ? 16 / 9 : frameClass === "portrait" ? 9 / 16 : 1;
  const [ratio, setRatio] = useState(initialRatio);

  const playerRatio = useMemo(() => {
    if (!Number.isFinite(ratio) || ratio <= 0) return "1 / 1";
    return String(ratio);
  }, [ratio]);

  const maxWidthByRatio = useMemo(() => {
    if (!Number.isFinite(ratio) || ratio <= 0) return "75vh";
    if (ratio >= 1.2) return "100%";
    return `calc(75vh * ${ratio})`;
  }, [ratio]);

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

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;

    const updateRatioFromMetadata = () => {
      const w = node.videoWidth;
      const h = node.videoHeight;
      if (w > 0 && h > 0) {
        setRatio(w / h);
      }
    };

    node.addEventListener("loadedmetadata", updateRatioFromMetadata);
    return () => {
      node.removeEventListener("loadedmetadata", updateRatioFromMetadata);
    };
  }, [playbackSrc]);

  return (
    <div
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
      <video
        ref={videoRef}
        src={playbackSrc}
        poster={video.media.posterUrl || undefined}
        preload="metadata"
        playsInline
        referrerPolicy="no-referrer"
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
  );
}
