"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChatText } from "@phosphor-icons/react";
import EmptyState from "@/components/common/EmptyState";
import type { CommentItem } from "@/lib/types";

interface Props {
  videoId: string;
  initialComments: CommentItem[];
  viewerLoggedIn: boolean;
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
    <div className="flex">
      {/* Left column: avatar + thread line */}
      <div className="flex flex-col items-center shrink-0 w-10">
        <Link href={comment.author.profileUrl} className="shrink-0">
          <Image
            src={comment.author.imageUrl}
            alt={comment.author.name}
            width={32}
            height={32}
            className="rounded-full object-cover w-8 h-8 block"
            unoptimized
          />
        </Link>
        {/* Thread line — wider hit area, thin visible line */}
        {(hasReplies || showReplyBox) && !collapsed && (
          <div
            onClick={() => setCollapsed(true)}
            title="折叠回复"
            className="thread-line-hitarea flex-1 w-5 mt-0.5 cursor-pointer flex justify-center"
          >
            <div className="thread-line-visible w-[3px] h-full rounded-[1.5px] bg-[#555] transition-colors" />
          </div>
        )}
      </div>

      {/* Right column: header + body + actions + replies */}
      <div className="flex-1 min-w-0 pt-1">
        <div className="flex items-center gap-2 mb-0.5">
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              title="展开回复"
              className="bg-transparent border-none cursor-pointer p-0 text-text-muted text-sm leading-none inline-flex items-center justify-center w-4 h-4 rounded-sm transition-colors hover:text-accent"
            >
              +
            </button>
          )}
          <Link href={comment.author.profileUrl} className="font-semibold text-[0.8125rem] text-text-primary">
            {comment.author.name}
          </Link>
          <span className="text-xs text-text-muted">{comment.createdAtText}</span>
          {comment.editedAtText && (
            <span className="text-xs text-text-muted">(已编辑)</span>
          )}
        </div>

        {collapsed ? (
          /* Collapsed: single-line summary */
          <p
            onClick={() => setCollapsed(false)}
            className="text-[0.8125rem] text-text-muted cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap mt-0.5"
          >
            {comment.body.slice(0, 60)}{comment.body.length > 60 ? "…" : ""}
            {hasReplies && <span className="ml-1.5">({comment.replies!.length} 条回复)</span>}
          </p>
        ) : (
          <>
            <p className="text-sm text-text-secondary leading-relaxed break-words">
              {comment.body}
            </p>

            {/* Action buttons */}
            <div className="flex gap-3 mt-1.5">
              <button
                onClick={handleReplyClick}
                className="bg-transparent border-none cursor-pointer text-text-muted text-xs py-0.5 px-0 transition-colors hover:text-text-primary"
              >
                回复
              </button>
              {comment.isOwner && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className={`bg-transparent border-none text-text-muted text-xs py-0.5 px-0 transition-colors hover:text-accent ${deleting ? "cursor-not-allowed" : "cursor-pointer"}`}
                  title="删除评论"
                >
                  {deleting ? "删除中…" : "删除"}
                </button>
              )}
            </div>

            {/* Inline reply box */}
            {showReplyBox && (
              <div className="flex gap-2 mt-2.5">
                {viewerImage && (
                  <Image src={viewerImage} alt={viewerName ?? "我"} width={24} height={24}
                    className="rounded-full object-cover w-6 h-6 shrink-0 mt-1.5" unoptimized />
                )}
                <div className="flex-1">
                  <textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder={`回复 ${comment.author.name}…`}
                    disabled={posting}
                    rows={2}
                    autoFocus
                    className="w-full bg-[var(--bg-input)] border border-border rounded-lg py-2 px-2.5 text-text-primary text-sm resize-y outline-none box-border"
                  />
                  <div className="flex gap-2 justify-end mt-1.5">
                    <button
                      onClick={() => { setShowReplyBox(false); setReplyBody(""); }}
                      className="bg-transparent border border-border rounded-md py-[5px] px-3.5 text-[0.8125rem] text-text-secondary cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleReplySubmit}
                      disabled={posting || !replyBody.trim()}
                      className="inline-flex items-center gap-1.5 rounded-md bg-accent py-[5px] px-3.5 text-[0.8125rem] font-semibold text-white border-none cursor-pointer transition-colors hover:bg-accent-hover disabled:opacity-50"
                    >
                      {posting ? "发送中…" : "回复"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Replies — no extra indent, the thread line provides the visual cue */}
            {hasReplies && (
              <div className="mt-2">
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

export default function CommentsList({ videoId, initialComments, viewerLoggedIn, viewerName, viewerImage }: Props) {
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
      <h3 className="text-base font-bold mb-4">
        评论 ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0)})
      </h3>

      {/* Comment input */}
      <div className="flex gap-2.5 mb-6">
        {viewerImage && (
          <Image src={viewerImage} alt={viewerName ?? "我"} width={32} height={32}
            className="rounded-full object-cover w-8 h-8 shrink-0" unoptimized />
        )}
        <div className="flex-1">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={viewerLoggedIn ? "写下你的评论…" : "登录后发表评论"}
            disabled={!viewerLoggedIn || posting}
            rows={3}
            className="w-full bg-[var(--bg-input)] border border-border rounded-lg py-2.5 px-3 text-text-primary text-sm resize-y outline-none box-border"
          />
          {error && <p className="text-accent text-[0.8125rem] mt-1">{error}</p>}
          <div className="flex justify-end mt-2">
            <button
              onClick={postComment}
              disabled={posting || !body.trim()}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent py-[7px] px-[18px] text-sm font-semibold text-white border-none cursor-pointer transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {posting ? "发送中…" : "发表"}
            </button>
          </div>
        </div>
      </div>

      {/* Comment list */}
      {comments.length === 0 ? (
        <EmptyState
          icon={<ChatText size={20} weight="regular" />}
          title="暂无评论"
          description="发表第一条评论后，这里会显示互动内容。"
          framed={false}
        />
      ) : (
        comments.map((comment, idx) => (
          <div key={comment.id} className={`pb-3 ${idx < comments.length - 1 ? "mb-1" : ""}`}>
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
