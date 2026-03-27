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
  viewerUserId?: number | null;
  viewerName?: string | null;
  viewerImage?: string | null;
}

function CommentRow({ comment, videoId, onDelete, onReply, viewerLoggedIn, viewerImage, viewerName }: {
  comment: CommentItem;
  videoId: string;
  onDelete: (id: number) => void;
  onReply: (parentId: number, replyToCommentId: number, body: string) => Promise<void>;
  viewerLoggedIn: boolean;
  viewerImage?: string | null;
  viewerName?: string | null;
}) {
  const [deleting, setDeleting] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();

  const hasReplies = (comment.replies?.length ?? 0) > 0;

  const handleDelete = async () => {
    if (!confirm("确定删除这条评论吗？")) return;
    setDeleting(true);
    await onDelete(comment.id);
    setDeleting(false);
  };

  const handleReplyClick = () => {
    if (!viewerLoggedIn) { router.push("/login"); return; }
    setShowReplyBox((v) => !v);
  };

  const handleReplySubmit = async () => {
    const text = replyBody.trim();
    if (!text) return;
    setPosting(true);
    const parentId = comment.parentId ?? comment.id;
    await onReply(parentId, comment.id, text);
    setReplyBody("");
    setShowReplyBox(false);
    setPosting(false);
  };

  return (
    <div style={{ display: "flex" }}>
      {/* Left column: avatar + thread line */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: "40px" }}>
        <Link href={comment.author.profileUrl} style={{ flexShrink: 0 }}>
          <Image
            src={comment.author.imageUrl}
            alt={comment.author.name}
            width={32}
            height={32}
            style={{ borderRadius: "50%", objectFit: "cover", width: 32, height: 32, display: "block" }}
            unoptimized
          />
        </Link>
        {/* Thread line — wider hit area, thin visible line */}
        {(hasReplies || showReplyBox) && !collapsed && (
          <div
            onClick={() => setCollapsed(true)}
            title="折叠回复"
            className="thread-line-hitarea"
            style={{
              flex: 1,
              width: "20px",
              marginTop: "2px",
              cursor: "pointer",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div className="thread-line-visible" style={{
              width: "3px",
              height: "100%",
              borderRadius: "1.5px",
              background: "#555",
              transition: "background 0.15s",
            }} />
          </div>
        )}
      </div>

      {/* Right column: header + body + actions + replies */}
      <div style={{ flex: 1, minWidth: 0, paddingTop: "4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              title="展开回复"
              style={{
                background: "none", border: "none", cursor: "pointer", padding: 0,
                color: "var(--text-muted)", fontSize: "0.875rem", lineHeight: 1,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: "16px", height: "16px", borderRadius: "2px",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}
            >
              +
            </button>
          )}
          <Link href={comment.author.profileUrl} style={{ fontWeight: 600, fontSize: "0.8125rem", color: "var(--text-primary)" }}>
            {comment.author.name}
          </Link>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{comment.createdAtText}</span>
          {comment.editedAtText && (
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>(已编辑)</span>
          )}
        </div>

        {collapsed ? (
          /* Collapsed: single-line summary */
          <p
            onClick={() => setCollapsed(false)}
            style={{
              fontSize: "0.8125rem", color: "var(--text-muted)", cursor: "pointer",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              marginTop: "2px",
            }}
          >
            {comment.body.slice(0, 60)}{comment.body.length > 60 ? "…" : ""}
            {hasReplies && <span style={{ marginLeft: "6px" }}>({comment.replies!.length} 条回复)</span>}
          </p>
        ) : (
          <>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5, wordBreak: "break-word" }}>
              {comment.body}
            </p>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "12px", marginTop: "6px" }}>
              <button
                onClick={handleReplyClick}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--text-muted)", fontSize: "0.75rem", padding: "2px 0",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}
              >
                回复
              </button>
              {comment.isOwner && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    background: "none", border: "none",
                    cursor: deleting ? "not-allowed" : "pointer",
                    color: "var(--text-muted)", fontSize: "0.75rem", padding: "2px 0",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}
                  title="删除评论"
                >
                  {deleting ? "删除中…" : "删除"}
                </button>
              )}
            </div>

            {/* Inline reply box */}
            {showReplyBox && (
              <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                {viewerImage && (
                  <Image src={viewerImage} alt={viewerName ?? "我"} width={24} height={24}
                    style={{ borderRadius: "50%", objectFit: "cover", width: 24, height: 24, flexShrink: 0, marginTop: "6px" }} unoptimized />
                )}
                <div style={{ flex: 1 }}>
                  <textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder={`回复 ${comment.author.name}…`}
                    disabled={posting}
                    rows={2}
                    autoFocus
                    style={{
                      width: "100%", background: "var(--bg-input)", border: "1px solid var(--border)",
                      borderRadius: "8px", padding: "8px 10px", color: "var(--text-primary)",
                      fontSize: "0.875rem", resize: "vertical", outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "6px" }}>
                    <button
                      onClick={() => { setShowReplyBox(false); setReplyBody(""); }}
                      style={{
                        background: "none", border: "1px solid var(--border)", borderRadius: "6px",
                        padding: "5px 14px", fontSize: "0.8125rem", color: "var(--text-secondary)", cursor: "pointer",
                      }}
                    >
                      取消
                    </button>
                    <button
                      onClick={handleReplySubmit}
                      disabled={posting || !replyBody.trim()}
                      className="btn-primary"
                      style={{ padding: "5px 14px", fontSize: "0.8125rem" }}
                    >
                      {posting ? "发送中…" : "回复"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Replies — no extra indent, the thread line provides the visual cue */}
            {hasReplies && (
              <div style={{ marginTop: "8px" }}>
                {comment.replies!.map((reply) => (
                  <CommentRow
                    key={reply.id}
                    comment={reply}
                    videoId={videoId}
                    onDelete={onDelete}
                    onReply={onReply}
                    viewerLoggedIn={viewerLoggedIn}
                    viewerImage={viewerImage}
                    viewerName={viewerName}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function CommentsList({ videoId, initialComments, viewerLoggedIn, viewerUserId, viewerName, viewerImage }: Props) {
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const refreshComments = async () => {
    const res = await fetch(`/api/videos/${videoId}/comments`);
    if (res.ok) {
      const data = await res.json();
      setComments(data.comments ?? data);
    }
  };

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
      await refreshComments();
    } finally {
      setPosting(false);
    }
  };

  const postReply = async (parentId: number, replyToCommentId: number, replyText: string) => {
    const res = await fetch(`/api/videos/${videoId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: replyText, parent_id: parentId, reply_to_comment_id: replyToCommentId }),
    });
    if (res.status === 401) { router.push("/login"); return; }
    if (res.ok) {
      router.refresh();
      await refreshComments();
    }
  };

  const deleteComment = async (id: number) => {
    const res = await fetch(`/api/videos/${videoId}/comments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setComments((prev) =>
        prev
          .filter((c) => c.id !== id)
          .map((c) => ({ ...c, replies: c.replies?.filter((r) => r.id !== id) }))
      );
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
        comments.map((comment, idx) => (
          <div key={comment.id} style={{ paddingBottom: "12px", marginBottom: idx < comments.length - 1 ? "4px" : 0 }}>
            <CommentRow
              comment={comment}
              videoId={videoId}
              onDelete={deleteComment}
              onReply={postReply}
              viewerLoggedIn={viewerLoggedIn}
              viewerImage={viewerImage}
              viewerName={viewerName}
            />
          </div>
        ))
      )}
    </div>
  );
}
