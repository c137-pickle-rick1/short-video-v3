import type { ReactNode } from "react";
import type { VideoFeedItem } from "@/lib/types";
import { VideoCameraIcon } from "@phosphor-icons/react/dist/ssr";
import EmptyState from "@/components/common/EmptyState";
import VideoCard from "./VideoCard";

interface VideoGridProps {
  videos: VideoFeedItem[];
  showAuthor?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
}

export default function VideoGrid({
  videos,
  showAuthor = true,
  emptyMessage = "暂无视频",
  emptyDescription = "有新内容后，这里会自动更新。",
  emptyIcon,
}: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon ?? <VideoCameraIcon size={20} weight="regular" />}
        title={emptyMessage}
        description={emptyDescription}
      />
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
