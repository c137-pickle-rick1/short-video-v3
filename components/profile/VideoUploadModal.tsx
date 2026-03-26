"use client";

import { useRef, useState } from "react";
import { VideoCamera, X, UploadSimple, SpinnerGap } from "@phosphor-icons/react";

interface Props {
  onClose: () => void;
  onSuccess?: (videoId: number, title: string) => void;
}

const MAX_FILE_SIZE = 200 * 1024 * 1024;
const ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"];

export default function VideoUploadModal({ onClose, onSuccess }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("不支持的格式，请上传 MP4、MOV、M4V 或 WEBM");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("文件大小不能超过 200MB");
      return;
    }

    setError("");
    setSelectedFile(file);
    // Auto-fill title from filename (strip extension)
    if (!title) {
      const name = file.name.replace(/\.[^.]+$/, "").slice(0, 120);
      setTitle(name);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile || !title.trim()) {
      setError(!selectedFile ? "请选择视频文件" : "请填写标题");
      return;
    }

    setError("");
    setUploading(true);
    setProgress(10);

    const formData = new FormData();
    formData.append("video", selectedFile);
    formData.append("title", title.trim());
    if (tags.trim()) formData.append("tags", tags.trim());

    // Simulate progress while uploading
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 5, 90));
    }, 500);

    try {
      const res = await fetch("/api/videos", { method: "POST", body: formData });
      clearInterval(progressInterval);
      setProgress(100);

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "上传失败，请重试");
        setUploading(false);
        setProgress(0);
        return;
      }

      onSuccess?.(data.id, data.title);
      onClose();
    } catch {
      clearInterval(progressInterval);
      setError("网络错误，请检查连接后重试");
      setUploading(false);
      setProgress(0);
    }
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !uploading) onClose(); }}
    >
      <div
        style={{
          background: "#1a1a1a",
          border: "1px solid #2a2a2a",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "520px",
          padding: "24px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>上传视频</h2>
          {!uploading && (
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#999", padding: "4px" }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* File picker */}
          <div
            style={{
              border: "2px dashed #2a2a2a",
              borderRadius: "12px",
              padding: "20px",
              textAlign: "center",
              cursor: uploading ? "not-allowed" : "pointer",
            }}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.mov,.m4v,.webm"
              onChange={handleFileChange}
              disabled={uploading}
              style={{ display: "none" }}
            />
            <VideoCamera size={32} color="#666" style={{ marginBottom: "8px" }} />
            {selectedFile ? (
              <>
                <p style={{ fontSize: "0.875rem", color: "#f0f0f0", fontWeight: 600 }}>
                  {selectedFile.name}
                </p>
                <p style={{ fontSize: "0.75rem", color: "#666", marginTop: "4px" }}>
                  {(selectedFile.size / 1024 / 1024).toFixed(1)} MB · 点击重新选择
                </p>
              </>
            ) : (
              <>
                <p style={{ fontSize: "0.875rem", color: "#999" }}>点击选择视频文件</p>
                <p style={{ fontSize: "0.75rem", color: "#555", marginTop: "4px" }}>
                  支持 MP4、MOV、M4V、WEBM，最大 200MB
                </p>
              </>
            )}
          </div>

          {/* Title */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "#ccc" }}>标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 120))}
              disabled={uploading}
              placeholder="给这条视频起个醒目的标题"
              maxLength={120}
              style={{
                background: "#242424", border: "1px solid #333", borderRadius: "8px",
                padding: "10px 14px", fontSize: "0.9375rem", color: "#f0f0f0",
                outline: "none",
              }}
            />
          </div>

          {/* Tags */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "#ccc" }}>标签</label>
              <span style={{ fontSize: "0.75rem", color: "#555" }}>多个标签用逗号分隔</span>
            </div>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value.slice(0, 120))}
              disabled={uploading}
              placeholder="例如：旅行, 探店, Vlog"
              maxLength={120}
              style={{
                background: "#242424", border: "1px solid #333", borderRadius: "8px",
                padding: "10px 14px", fontSize: "0.9375rem", color: "#f0f0f0",
                outline: "none",
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <p style={{
              background: "rgba(229,25,42,0.1)", border: "1px solid rgba(229,25,42,0.3)",
              borderRadius: "8px", padding: "10px 14px",
              fontSize: "0.875rem", color: "#e5192a",
            }}>
              {error}
            </p>
          )}

          {/* Progress bar */}
          {uploading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ height: "6px", background: "#2a2a2a", borderRadius: "3px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%", background: "#e5192a", borderRadius: "3px",
                    width: `${progress}%`, transition: "width 0.3s ease",
                  }}
                />
              </div>
              <p style={{ fontSize: "0.75rem", color: "#666", textAlign: "center" }}>
                {progress < 100 ? `上传中… ${progress}%` : "处理中…"}
              </p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            {!uploading && (
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "10px 20px", borderRadius: "8px",
                  border: "1px solid #333", background: "none",
                  color: "#ccc", fontSize: "0.875rem", cursor: "pointer",
                }}
              >
                取消
              </button>
            )}
            <button
              type="submit"
              disabled={uploading || !selectedFile || !title.trim()}
              style={{
                padding: "10px 20px", borderRadius: "8px",
                background: uploading || !selectedFile || !title.trim() ? "#2a2a2a" : "#e5192a",
                color: uploading || !selectedFile || !title.trim() ? "#555" : "#fff",
                border: "none", fontSize: "0.875rem", fontWeight: 600,
                cursor: uploading || !selectedFile || !title.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: "6px",
              }}
            >
              {uploading
                ? <><SpinnerGap size={16} style={{ animation: "spin 1s linear infinite" }} /> 上传中</>
                : <><UploadSimple size={16} /> 开始上传</>
              }
            </button>
          </div>
        </form>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}
