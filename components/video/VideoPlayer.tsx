"use client";

import { useEffect, useRef } from "react";
import type { VideoDetail } from "@/lib/types";

interface Props {
  video: VideoDetail;
}

export default function VideoPlayer({ video }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const plyrRef = useRef<import("plyr") | null>(null);

  const src = video.media.hlsUrl || video.media.videoUrl;

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
        ratio: video.media.frameClass === "landscape" ? "16:9" : video.media.frameClass === "portrait" ? "9:16" : "1:1",
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
  }, [video.media.frameClass]);

  return (
    <div
      style={{
        position: "relative",
        background: "#000",
        borderRadius: "10px",
        overflow: "hidden",
        maxHeight: "75vh",
      }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={video.media.posterUrl || undefined}
        preload="metadata"
        playsInline
      />
    </div>
  );
}
