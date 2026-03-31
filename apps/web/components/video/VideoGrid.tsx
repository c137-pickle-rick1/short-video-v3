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
      <div className="text-center py-16 text-text-muted text-base">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {videos.map((video, index) => (
        <VideoCard key={video.videoId} video={video} showAuthor={showAuthor} eagerPoster={index === 0} />
      ))}
    </div>
  );
}
