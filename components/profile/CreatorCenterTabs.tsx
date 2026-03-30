"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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

type TabKey = "published" | "reviewing" | "uploading" | "removed";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "published", label: "已发布" },
  { key: "reviewing", label: "审核中" },
  { key: "uploading", label: "上传中" },
  { key: "removed", label: "已下架" },
];

const STATUS_LABEL: Record<string, string> = {
  queued: "排队中",
  uploading: "上传中",
  processing: "审核中",
  reviewing: "审核中",
  pending_review: "审核中",
  published: "已发布",
  upload_failed: "上传失败",
  removed: "已下架",
};

function inTab(status: string, tab: TabKey): boolean {
  if (tab === "published") return status === "published";
  if (tab === "reviewing") return ["processing", "reviewing", "pending_review"].includes(status);
  if (tab === "uploading") return ["queued", "uploading", "upload_failed"].includes(status);
  return status === "removed";
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    queued: { bg: "rgba(99,102,241,0.15)", color: "#a5b4fc" },
    uploading: { bg: "rgba(99,102,241,0.15)", color: "#a5b4fc" },
    processing: { bg: "rgba(234,179,8,0.15)", color: "#fde047" },
    reviewing: { bg: "rgba(234,179,8,0.15)", color: "#fde047" },
    pending_review: { bg: "rgba(234,179,8,0.15)", color: "#fde047" },
    published: { bg: "rgba(34,197,94,0.15)", color: "#86efac" },
    upload_failed: { bg: "rgba(229,25,42,0.15)", color: "#fca5a5" },
    removed: { bg: "rgba(107,114,128,0.15)", color: "#9ca3af" },
  };

  const style = colors[status] ?? { bg: "#2a2a2a", color: "#999" };
  const Icon = status === "queued" || status === "uploading" || status === "processing" || status === "reviewing" || status === "pending_review"
    ? Clock
    : status === "published"
      ? CheckCircle
      : status === "upload_failed"
        ? Warning
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

export default function CreatorCenterTabs({ initialVideos }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [videos, setVideos] = useState<UploadedVideo[]>(initialVideos);
  const [activeTab, setActiveTab] = useState<TabKey>("published");

  function handleUploadSuccess(id: number, title: string) {
    setVideos((prev) => [{ id, title, status: "queued", posterUrl: null, createdAt: new Date().toISOString() }, ...prev]);
    setActiveTab("uploading");
  }

  const counts = useMemo(() => {
    return {
      published: videos.filter((v) => inTab(v.status, "published")).length,
      reviewing: videos.filter((v) => inTab(v.status, "reviewing")).length,
      uploading: videos.filter((v) => inTab(v.status, "uploading")).length,
      removed: videos.filter((v) => inTab(v.status, "removed")).length,
    };
  }, [videos]);

  const filteredVideos = useMemo(() => {
    return videos.filter((v) => inTab(v.status, activeTab));
  }, [videos, activeTab]);

  return (
    <div className="bg-bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between gap-2.5 flex-wrap mb-4">
        <h2 className="text-base font-bold">创作者中心</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white border-none text-sm font-semibold cursor-pointer"
        >
          <UploadSimple size={16} />
          上传视频
        </button>
      </div>

      <div className="flex gap-2 flex-wrap mb-3.5">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`border rounded-full px-3 py-1.5 text-[0.8125rem] font-semibold cursor-pointer ${isActive ? "border-accent bg-accent-dim text-text-primary" : "border-border-light bg-transparent text-text-secondary"}`}
            >
              {tab.label} ({counts[tab.key]})
            </button>
          );
        })}
      </div>

      {filteredVideos.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-xl py-8 px-5 text-center">
          <VideoCamera size={36} color="#444" className="mb-2.5" />
          <p className="text-[0.9375rem] text-[#666]">当前分类下还没有视频</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className="flex items-center gap-3 bg-[#1a1a1a] border border-border rounded-[10px] p-3"
            >
              <div className="w-16 h-16 rounded-md bg-[#242424] shrink-0 overflow-hidden flex items-center justify-center">
                {video.posterUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={video.posterUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <VideoCamera size={24} color="#444" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[0.9375rem] font-semibold overflow-hidden text-ellipsis whitespace-nowrap">
                  {video.title ?? "未命名视频"}
                </p>
                <div className="mt-1">
                  <StatusBadge status={video.status} />
                </div>
                {video.status === "upload_failed" && (
                  <p className="text-xs text-[#e5192a] mt-1">上传失败，请重新上传</p>
                )}
              </div>

              {video.status === "published" && (
                <Link
                  href={`/videos/${video.id}`}
                  className="px-3.5 py-1.5 rounded-md border border-border-light text-[#ccc] text-[0.8125rem] shrink-0 flex items-center"
                >
                  查看
                </Link>
              )}
              {(video.status === "queued" || video.status === "uploading" || video.status === "processing" || video.status === "reviewing" || video.status === "pending_review") && (
                <span className="text-text-muted text-[0.8125rem] shrink-0 flex items-center gap-1">
                  <ArrowClockwise size={14} className="animate-spin" />
                  处理中
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && <VideoUploadModal onClose={() => setShowModal(false)} onSuccess={handleUploadSuccess} />}
    </div>
  );
}
