"use client";

import { useState } from "react";
import { UploadSimple, VideoCamera, Clock, CheckCircle, Warning, ArrowClockwise } from "@phosphor-icons/react";
import VideoUploadModal from "./VideoUploadModal";

interface UploadedVideo {
  id: number;
  title: string | null;
  status: string;
  posterUrl: string | null;
  createdAt: string | null;
}

interface Props {
  initialVideos: UploadedVideo[];
}

const STATUS_LABEL: Record<string, string> = {
  queued: "排队中",
  processing: "处理中",
  published: "已发布",
  upload_failed: "上传失败",
  removed: "已下架",
};

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    queued: { bg: "rgba(99,102,241,0.15)", color: "#a5b4fc" },
    processing: { bg: "rgba(234,179,8,0.15)", color: "#fde047" },
    published: { bg: "rgba(34,197,94,0.15)", color: "#86efac" },
    upload_failed: { bg: "rgba(229,25,42,0.15)", color: "#fca5a5" },
    removed: { bg: "rgba(107,114,128,0.15)", color: "#9ca3af" },
  };

  const style = colors[status] ?? { bg: "#2a2a2a", color: "#999" };
  const Icon = status === "queued" || status === "processing" ? Clock
    : status === "published" ? CheckCircle
    : status === "upload_failed" ? Warning
    : Clock;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[20px] text-xs font-semibold"
      style={{ background: style.bg, color: style.color }}
    >
      <Icon size={12} weight="fill" />
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export default function MyVideosSection({ initialVideos }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [videos, setVideos] = useState<UploadedVideo[]>(initialVideos);

  function handleUploadSuccess(id: number, title: string) {
    setVideos((prev) => [
      { id, title, status: "queued", posterUrl: null, createdAt: new Date().toISOString() },
      ...prev,
    ]);
  }

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold">我的视频</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#e5192a] text-white border-none text-sm font-semibold cursor-pointer"
        >
          <UploadSimple size={16} />
          上传视频
        </button>
      </div>

      {/* Video list */}
      {videos.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-xl py-10 px-5 text-center">
          <VideoCamera size={40} color="#444" className="mb-3" />
          <p className="text-[0.9375rem] text-[#666]">还没有上传任何视频</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-3 px-5 py-2 rounded-lg bg-[#e5192a] text-white border-none text-sm font-semibold cursor-pointer"
          >
            立即上传
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {videos.map((video) => (
            <div
              key={video.id}
              className="flex items-center gap-3 bg-[#1a1a1a] border border-border rounded-[10px] p-3"
            >
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-md bg-[#242424] shrink-0 overflow-hidden flex items-center justify-center">
                {video.posterUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={video.posterUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <VideoCamera size={24} color="#444" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[0.9375rem] font-semibold overflow-hidden text-ellipsis whitespace-nowrap">
                  {video.title ?? "未命名视频"}
                </p>
                <div className="mt-1">
                  <StatusBadge status={video.status} />
                </div>
                {video.status === "upload_failed" && (
                  <p className="text-xs text-[#e5192a] mt-1">
                    上传处理失败，请联系站长或重试
                  </p>
                )}
              </div>

              {/* Action */}
              {video.status === "published" && (
                <a
                  href={`/videos/${video.id}`}
                  className="px-3.5 py-1.5 rounded-md border border-border-light text-[#ccc] text-[0.8125rem] shrink-0 flex items-center"
                >
                  查看
                </a>
              )}
              {(video.status === "queued" || video.status === "processing") && (
                <span className="text-text-muted text-[0.8125rem] shrink-0 flex items-center gap-1">
                  <ArrowClockwise size={14} className="animate-spin" />
                  等待中
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <VideoUploadModal
          onClose={() => setShowModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
