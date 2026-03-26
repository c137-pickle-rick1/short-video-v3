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
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "2px 8px", borderRadius: "20px",
      fontSize: "0.75rem", fontWeight: 600,
      background: style.bg, color: style.color,
    }}>
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>我的视频</h2>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "8px 16px", borderRadius: "8px",
            background: "#e5192a", color: "#fff",
            border: "none", fontSize: "0.875rem", fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <UploadSimple size={16} />
          上传视频
        </button>
      </div>

      {/* Video list */}
      {videos.length === 0 ? (
        <div style={{
          border: "2px dashed #2a2a2a", borderRadius: "12px",
          padding: "40px 20px", textAlign: "center",
        }}>
          <VideoCamera size={40} color="#444" style={{ marginBottom: "12px" }} />
          <p style={{ fontSize: "0.9375rem", color: "#666" }}>还没有上传任何视频</p>
          <button
            onClick={() => setShowModal(true)}
            style={{
              marginTop: "12px", padding: "8px 20px", borderRadius: "8px",
              background: "#e5192a", color: "#fff",
              border: "none", fontSize: "0.875rem", fontWeight: 600,
              cursor: "pointer",
            }}
          >
            立即上传
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {videos.map((video) => (
            <div
              key={video.id}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                background: "#1a1a1a", border: "1px solid #2a2a2a",
                borderRadius: "10px", padding: "12px",
              }}
            >
              {/* Thumbnail */}
              <div style={{
                width: "64px", height: "64px", borderRadius: "6px",
                background: "#242424", flexShrink: 0,
                overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {video.posterUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={video.posterUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <VideoCamera size={24} color="#444" />
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: "0.9375rem", fontWeight: 600,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {video.title ?? "未命名视频"}
                </p>
                <div style={{ marginTop: "4px" }}>
                  <StatusBadge status={video.status} />
                </div>
                {video.status === "upload_failed" && (
                  <p style={{ fontSize: "0.75rem", color: "#e5192a", marginTop: "4px" }}>
                    上传处理失败，请联系站长或重试
                  </p>
                )}
              </div>

              {/* Action */}
              {video.status === "published" && (
                <a
                  href={`/videos/${video.id}`}
                  style={{
                    padding: "6px 14px", borderRadius: "6px",
                    border: "1px solid #333", color: "#ccc",
                    fontSize: "0.8125rem", flexShrink: 0,
                    display: "flex", alignItems: "center",
                  }}
                >
                  查看
                </a>
              )}
              {(video.status === "queued" || video.status === "processing") && (
                <span style={{ color: "#555", fontSize: "0.8125rem", flexShrink: 0, display: "flex", alignItems: "center", gap: "4px" }}>
                  <ArrowClockwise size={14} style={{ animation: "spin 2s linear infinite" }} />
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
