// Shared presenter utilities (format data for display)

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "刚刚";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}个月前`;
  const years = Math.floor(months / 12);
  return `${years}年前`;
}

export function getDisplayName(name: string | null, username: string | null): string {
  return name?.trim() || username?.trim() || "未知用户";
}

export function getHandle(username: string | null): string {
  return username ? `@${username}` : "@未知";
}

export function getProfileUrl(username: string | null): string {
  return username ? `/user/${username}` : "/";
}

export function getVideoUrl(id: number | string): string {
  return `/videos/${id}`;
}

export function normalizeAvatarUrl(
  avatarUrl: string | null,
  name: string | null,
  username: string | null,
): string {
  if (avatarUrl?.trim()) return avatarUrl.trim();
  // Return a placeholder — could use DiceBear or similar
  const seed = name?.trim() || username?.trim() || "user";
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=e5192a&textColor=ffffff`;
}

export function getVideoSummary(
  title: string | null,
  caption: string | null,
  description: string | null,
): string {
  return title?.trim() || caption?.trim() || description?.trim() || "无标题";
}

export function getFrameClass(width: number | null, height: number | null): string {
  if (!width || !height) return "aspect-video";
  const ratio = width / height;
  if (ratio > 1.5) return "aspect-video";
  if (ratio < 0.8) return "aspect-[9/16]";
  return "aspect-square";
}

export function getVideoMediaUrls(
  origin: string | null,
  playbackUrl: string | null,
  hlsUrl: string | null,
) {
  return {
    fallbackUrl: playbackUrl ?? "",
    hlsUrl: hlsUrl ?? "",
  };
}

export function escapeSqlLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
