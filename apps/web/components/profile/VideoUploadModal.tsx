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
      className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !uploading) onClose(); }}
    >
      <div className="bg-[#1a1a1a] border border-border rounded-2xl w-full max-w-[520px] p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">上传视频</h2>
          {!uploading && (
            <button
              onClick={onClose}
              className="bg-transparent border-none cursor-pointer text-text-secondary p-1"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* File picker */}
          <div
            className={`border-2 border-dashed border-border rounded-xl p-5 text-center ${uploading ? "cursor-not-allowed" : "cursor-pointer"}`}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.mov,.m4v,.webm"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
            <VideoCamera size={32} color="#666" className="mb-2" />
            {selectedFile ? (
              <>
                <p className="text-sm text-[#f0f0f0] font-semibold">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-[#666] mt-1">
                  {(selectedFile.size / 1024 / 1024).toFixed(1)} MB · 点击重新选择
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-text-secondary">点击选择视频文件</p>
                <p className="text-xs text-text-muted mt-1">
                  支持 MP4、MOV、M4V、WEBM，最大 200MB
                </p>
              </>
            )}
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#ccc]">标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 120))}
              disabled={uploading}
              placeholder="给这条视频起个醒目的标题"
              maxLength={120}
              className="bg-[#242424] border border-border-light rounded-lg px-3.5 py-2.5 text-[0.9375rem] text-[#f0f0f0] outline-none"
            />
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between">
              <label className="text-sm font-semibold text-[#ccc]">标签</label>
              <span className="text-xs text-text-muted">多个标签用逗号分隔</span>
            </div>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value.slice(0, 120))}
              disabled={uploading}
              placeholder="例如：旅行, 探店, Vlog"
              maxLength={120}
              className="bg-[#242424] border border-border-light rounded-lg px-3.5 py-2.5 text-[0.9375rem] text-[#f0f0f0] outline-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="bg-[rgba(229,25,42,0.1)] border border-[rgba(229,25,42,0.3)] rounded-lg px-3.5 py-2.5 text-sm text-[#e5192a]">
              {error}
            </p>
          )}

          {/* Progress bar */}
          {uploading && (
            <div className="flex flex-col gap-1.5">
              <div className="h-1.5 bg-border rounded-sm overflow-hidden">
                <div
                  className="h-full bg-[#e5192a] rounded-sm transition-[width] duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-[#666] text-center">
                {progress < 100 ? `上传中… ${progress}%` : "处理中…"}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2.5 justify-end">
            {!uploading && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg border border-border-light bg-transparent text-[#ccc] text-sm cursor-pointer"
              >
                取消
              </button>
            )}
            <button
              type="submit"
              disabled={uploading || !selectedFile || !title.trim()}
              className={`px-5 py-2.5 rounded-lg border-none text-sm font-semibold flex items-center gap-1.5 ${
                uploading || !selectedFile || !title.trim()
                  ? "bg-border text-text-muted cursor-not-allowed"
                  : "bg-[#e5192a] text-white cursor-pointer"
              }`}
            >
              {uploading
                ? <><SpinnerGap size={16} className="animate-spin" /> 上传中</>
                : <><UploadSimple size={16} /> 开始上传</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
