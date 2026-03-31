"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { VideoFeedItem } from "@/lib/types";

interface VideoCardProps {
  video: VideoFeedItem;
  showAuthor?: boolean;
  eagerPoster?: boolean;
}

export default function VideoCard({ video, showAuthor = true, eagerPoster = false }: VideoCardProps) {
  const router = useRouter();
  return (
    <Link
      href={video.detailUrl}
      className="video-card block bg-bg-card rounded-lg overflow-hidden border border-border transition-[border-color,transform] duration-150"
    >
      {/* Thumbnail */}
      <div className="relative pb-[100%] bg-[#111]">
        {video.media.posterUrl ? (
          <>
            {/* Blurred background layer */}
            <Image
              src={video.media.posterUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              loading={eagerPoster ? "eager" : "lazy"}
              className="object-cover blur-[24px] scale-[1.15] opacity-60"
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
              className="object-contain"
              unoptimized
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-bg-secondary flex items-center justify-center text-text-muted text-[2rem]">
            ▶
          </div>
        )}

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
        <p className={`line-clamp-2 text-[0.9375rem] text-text-primary leading-[1.4] ${showAuthor ? "mb-2" : "mb-0"}`}>
          {video.displayText}
        </p>

        {showAuthor && (
          <div
            className="flex items-center gap-1.5"
            onClick={(e) => {
              if (video.author.profileUrl && video.author.profileUrl !== "/") {
                e.preventDefault();
                e.stopPropagation();
                router.push(video.author.profileUrl);
              }
            }}
          >
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
        )}
      </div>
    </Link>
  );
}
