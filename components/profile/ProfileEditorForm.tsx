"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Props {
  name: string | null;
  bio: string | null;
  username: string | null;
  email: string | null;
  avatarUrl: string | null;
}

export default function ProfileEditorForm({ name, bio, username, email, avatarUrl }: Props) {
  const [displayName, setDisplayName] = useState(name ?? "");
  const [bioText, setBioText] = useState(bio ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarUrl);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("头像仅支持 JPG/PNG/WEBP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("头像不能超过 5MB");
      return;
    }

    setError(null);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("name", displayName.trim());
      formData.append("bio", bioText.trim());
      if (avatarFile) formData.append("avatar", avatarFile);

      const res = await fetch("/api/profile", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "保存失败");
        return;
      }
      setMessage("已保存");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3.5 w-full">
      <div>
        <label className="block text-[0.8125rem] font-semibold text-text-secondary mb-1.5">
          头像
        </label>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 min-w-14 min-h-14 shrink-0 rounded-full overflow-hidden border border-border bg-bg-secondary flex items-center justify-center">
            {avatarPreview ? (
              <Image src={avatarPreview} alt="头像预览" width={56} height={56} className="w-full h-full object-cover" unoptimized />
            ) : (
              <span className="text-xs text-text-muted">无头像</span>
            )}
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onAvatarChange}
            className="text-[0.8125rem] text-text-secondary"
          />
        </div>
      </div>

      <div>
        <label className="block text-[0.8125rem] font-semibold text-text-secondary mb-1.5">
          用户名
        </label>
        <input
          type="text"
          value={username ?? ""}
          disabled
          className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-[9px] text-text-muted text-sm cursor-not-allowed box-border"
        />
      </div>

      <div>
        <label className="block text-[0.8125rem] font-semibold text-text-secondary mb-1.5">
          邮箱
        </label>
        <input
          type="email"
          value={email ?? ""}
          disabled
          className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-[9px] text-text-muted text-sm cursor-not-allowed box-border"
        />
      </div>

      <div>
        <label className="block text-[0.8125rem] font-semibold text-text-secondary mb-1.5">
          昵称
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={50}
          placeholder="你的名字"
          className="w-full bg-[var(--bg-input)] border border-border rounded-lg px-3 py-[9px] text-text-primary text-sm outline-none box-border"
        />
      </div>

      <div>
        <label className="block text-[0.8125rem] font-semibold text-text-secondary mb-1.5">
          简介
        </label>
        <textarea
          value={bioText}
          onChange={(e) => setBioText(e.target.value)}
          maxLength={200}
          rows={4}
          placeholder="介绍一下自己…"
          className="w-full bg-[var(--bg-input)] border border-border rounded-lg px-3 py-[9px] text-text-primary text-sm resize-y outline-none box-border"
        />
      </div>

      {error && <p className="text-accent text-sm">{error}</p>}
      {message && <p className="text-[#4caf50] text-sm">{message}</p>}

      <button
        onClick={save}
        disabled={saving}
        className="self-start px-4 py-1.5 text-sm rounded-md bg-accent text-white border-none font-semibold cursor-pointer transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {saving ? "保存中…" : "保存修改"}
      </button>
    </div>
  );
}
