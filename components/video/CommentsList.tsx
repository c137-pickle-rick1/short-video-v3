"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { CommentItem } from "@/lib/types";

interface Props {
  videoId: string;
  initialComments: CommentItem[];
  viewerLoggedIn: boolean;
  viewerName?: string | null;
  viewerImage?: string | null;
}

function CommentRow({ comment, videoId, onDelete, viewerLoggedIn }: {
  comment: CommentItem;
  videoId: string;
  onDelete: (id: number) => void;
  viewerLoggedIn: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
      <Link href={comment.author.profileUrl}>
        <Image
          src={comment.author.imageUrl}
          alt={comment.author.name}
          width={32}
          height={32}
          style={{ borderRadius: "50%", objectFit: "cover", width: 32, height: 32, flexShrink: 0 }}
          unoptimized
        />
      </Link>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <Link href={comment.author.profileUrl} style={{ fontWeight: 600, fontSize: "0.8125rem", color: "var(--text-primary)" }}>
            {comment.author.name}
          </Link>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{comment.createdAtText}</span>
          {comment.editedAtText && (
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>(已编辑)</span>
          )}
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5, wordBreak: "break-word" }}>
          {comment.body}
        </p>
        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div style={{ marginTop: "12px", paddingLeft: "12px", borderLeft: "2px solid var(--border)" }}>
            {comment.replies.map((reply) => (
              <CommentRow key={reply.id} comment={reply} videoId={videoId} onDelete={onDelete} viewerLoggedIn={viewerLoggedIn} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentsList({ videoId, initialComments, viewerLoggedIn, viewerName, viewerImage }: Props) {
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const postComment = async () => {
    if (!viewerLoggedIn) { router.push("/login"); return; }
    const text = body.trim();
    if (!text) return;
    setPosting(true);
    setError(null);
    try {
      const res = await fetch(`/api/videos/${videoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (res.status === 401) { router.push("/login"); return; }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "发表失败");
        return;
      }
      setBody("");
      router.refresh();
      // Optimistically fetch updated comments
      const updatedRes = await fetch(`/api/videos/${videoId}/comments`);
      if (updatedRes.ok) {
        const data = await updatedRes.json();
        setComments(data.comments ?? data);
      }
    } finally {
      setPosting(false);
    }
  };

  const deleteComment = async (id: number) => {
    const res = await fetch(`/api/videos/${videoId}/comments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== id));
    }
  };

  return (
    <div>
      <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "16px" }}>
        评论 ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0)})
      </h3>

      {/* Comment input */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
        {viewerImage && (
          <Image src={viewerImage} alt={viewerName ?? "我"} width={32} height={32}
            style={{ borderRadius: "50%", objectFit: "cover", width: 32, height: 32, flexShrink: 0 }} unoptimized />
        )}
        <div style={{ flex: 1 }}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={viewerLoggedIn ? "写下你的评论…" : "登录后发表评论"}
            disabled={!viewerLoggedIn || posting}
            rows={3}
            style={{
              width: "100%", background: "var(--bg-input)", border: "1px solid var(--border)",
              borderRadius: "8px", padding: "10px 12px", color: "var(--text-primary)",
              fontSize: "0.875rem", resize: "vertical", outline: "none",
              boxSizing: "border-box",
            }}
          />
          {error && <p style={{ color: "var(--accent)", fontSize: "0.8125rem", marginTop: "4px" }}>{error}</p>}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
            <button
              onClick={postComment}
              disabled={posting || !body.trim()}
              className="btn-primary"
              style={{ padding: "7px 18px", fontSize: "0.875rem" }}
            >
              {posting ? "发送中…" : "发表"}
            </button>
          </div>
        </div>
      </div>

      {/* Comment list */}
      {comments.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", textAlign: "center", padding: "2rem 0" }}>暂无评论，来第一个留言吧</p>
      ) : (
        comments.map((comment) => (
          <CommentRow key={comment.id} comment={comment} videoId={videoId} onDelete={deleteComment} viewerLoggedIn={viewerLoggedIn} />
        ))
      )}
    </div>
  );
}
