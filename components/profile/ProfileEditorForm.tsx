"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  name: string | null;
  bio: string | null;
  username: string | null;
}

export default function ProfileEditorForm({ name, bio, username }: Props) {
  const [displayName, setDisplayName] = useState(name ?? "");
  const [bioText, setBioText] = useState(bio ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const save = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName.trim(), bio: bioText.trim() }),
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
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxWidth: "480px" }}>
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
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>用户名暂不支持修改</p>
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
        style={{ alignSelf: "flex-start", padding: "9px 24px" }}
      >
        {saving ? "保存中…" : "保存修改"}
      </button>
    </div>
  );
}
