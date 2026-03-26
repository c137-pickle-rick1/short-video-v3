import type { VideoFeedItem } from "@/lib/types";
import VideoCard from "./VideoCard";

interface VideoGridProps {
  videos: VideoFeedItem[];
  showAuthor?: boolean;
  emptyMessage?: string;
}

export default function VideoGrid({ videos, showAuthor = true, emptyMessage = "暂无视频" }: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "4rem 0",
          color: "var(--text-muted)",
          fontSize: "1rem",
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: "12px",
      }}
      className="video-grid"
    >
      {videos.map((video) => (
        <VideoCard key={video.videoId} video={video} showAuthor={showAuthor} />
      ))}

      <style>{`
        .video-grid { grid-template-columns: repeat(2, 1fr); }
        @media (min-width: 640px) {
          .video-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1024px) {
          .video-grid { grid-template-columns: repeat(4, 1fr); }
        }
      `}</style>
    </div>
  );
}
