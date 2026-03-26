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
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", width: "100%" }}>
      <div>
        <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
          头像
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "56px", height: "56px", minWidth: "56px", minHeight: "56px", flexShrink: 0, borderRadius: "50%", overflow: "hidden", border: "1px solid var(--border)", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {avatarPreview ? (
              <Image src={avatarPreview} alt="头像预览" width={56} height={56} style={{ width: "100%", height: "100%", objectFit: "cover" }} unoptimized />
            ) : (
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>无头像</span>
            )}
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onAvatarChange}
            style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}
          />
        </div>
      </div>

      <div>
        <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
          用户名
        </label>
        <input
          type="text"
          value={username ?? ""}
          disabled
          style={{
            width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)",
            borderRadius: "8px", padding: "9px 12px", color: "var(--text-muted)",
            fontSize: "0.875rem", cursor: "not-allowed", boxSizing: "border-box",
          }}
        />
      </div>

      <div>
        <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
          邮箱
        </label>
        <input
          type="email"
          value={email ?? ""}
          disabled
          style={{
            width: "100%", background: "var(--bg-secondary)", border: "1px solid var(--border)",
            borderRadius: "8px", padding: "9px 12px", color: "var(--text-muted)",
            fontSize: "0.875rem", cursor: "not-allowed", boxSizing: "border-box",
          }}
        />
      </div>

      <div>
        <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
          昵称
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={50}
          placeholder="你的名字"
          style={{
            width: "100%", background: "var(--bg-input)", border: "1px solid var(--border)",
            borderRadius: "8px", padding: "9px 12px", color: "var(--text-primary)",
            fontSize: "0.875rem", outline: "none", boxSizing: "border-box",
          }}
        />
      </div>

      <div>
        <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
          简介
        </label>
        <textarea
          value={bioText}
          onChange={(e) => setBioText(e.target.value)}
          maxLength={200}
          rows={4}
          placeholder="介绍一下自己…"
          style={{
            width: "100%", background: "var(--bg-input)", border: "1px solid var(--border)",
            borderRadius: "8px", padding: "9px 12px", color: "var(--text-primary)",
            fontSize: "0.875rem", resize: "vertical", outline: "none", boxSizing: "border-box",
          }}
        />
      </div>

      {error && <p style={{ color: "var(--accent)", fontSize: "0.875rem" }}>{error}</p>}
      {message && <p style={{ color: "#4caf50", fontSize: "0.875rem" }}>{message}</p>}

      <button
        onClick={save}
        disabled={saving}
        className="btn-primary"
        style={{ alignSelf: "flex-start", padding: "6px 16px", fontSize: "0.875rem" }}
      >
        {saving ? "保存中…" : "保存修改"}
      </button>
    </div>
  );
}
