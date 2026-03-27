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
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 8px",
        borderRadius: "20px",
        fontSize: "0.75rem",
        fontWeight: 600,
        background: style.bg,
        color: style.color,
      }}
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
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>创作者中心</h2>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            borderRadius: "8px",
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <UploadSimple size={16} />
          上传视频
        </button>
      </div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                border: "1px solid",
                borderColor: isActive ? "var(--accent)" : "var(--border-light)",
                background: isActive ? "var(--accent-dim)" : "transparent",
                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                borderRadius: "999px",
                padding: "6px 12px",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {tab.label} ({counts[tab.key]})
            </button>
          );
        })}
      </div>

      {filteredVideos.length === 0 ? (
        <div style={{ border: "2px dashed #2a2a2a", borderRadius: "12px", padding: "32px 20px", textAlign: "center" }}>
          <VideoCamera size={36} color="#444" style={{ marginBottom: "10px" }} />
          <p style={{ fontSize: "0.9375rem", color: "#666" }}>当前分类下还没有视频</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: "10px",
                padding: "12px",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "6px",
                  background: "#242424",
                  flexShrink: 0,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {video.posterUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={video.posterUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <VideoCamera size={24} color="#444" />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "0.9375rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {video.title ?? "未命名视频"}
                </p>
                <div style={{ marginTop: "4px" }}>
                  <StatusBadge status={video.status} />
                </div>
                {video.status === "upload_failed" && (
                  <p style={{ fontSize: "0.75rem", color: "#e5192a", marginTop: "4px" }}>上传失败，请重新上传</p>
                )}
              </div>

              {video.status === "published" && (
                <Link
                  href={`/videos/${video.id}`}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    border: "1px solid #333",
                    color: "#ccc",
                    fontSize: "0.8125rem",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  查看
                </Link>
              )}
              {(video.status === "queued" || video.status === "uploading" || video.status === "processing" || video.status === "reviewing" || video.status === "pending_review") && (
                <span style={{ color: "#555", fontSize: "0.8125rem", flexShrink: 0, display: "flex", alignItems: "center", gap: "4px" }}>
                  <ArrowClockwise size={14} style={{ animation: "spin 2s linear infinite" }} />
                  处理中
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && <VideoUploadModal onClose={() => setShowModal(false)} onSuccess={handleUploadSuccess} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
