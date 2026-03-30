import { getViewerBookmarks } from "@/lib/server/queries/user";
import { resolveViewerUserIdFromCookieToken } from "@/lib/server/auth";
import BookmarksGrid from "@/components/profile/BookmarksGrid";
import Pagination from "@/components/layout/Pagination";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { VideoFeedItem } from "@/lib/types";

const PAGE_SIZE = 24;

export default async function BookmarksPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const jar = await cookies();
  const token = jar.get("sv_session")?.value ?? null;
  const viewerUserId = token ? await resolveViewerUserIdFromCookieToken(token) : null;
  if (!viewerUserId) redirect("/login?redirect_to=/me/bookmarks");

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  let videos: VideoFeedItem[] = [];
  let total = 0;
  let error = null;

  try {
    const result = await getViewerBookmarks(viewerUserId, page, PAGE_SIZE);
    videos = result.videos;
    total = result.total;
  } catch (e) {
    error = e instanceof Error ? e.message : "加载失败";
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-5">
      <div className="flex items-center gap-2 mb-5">
        <Link href="/me" className="text-text-muted text-sm">个人中心</Link>
        <span className="text-text-muted">›</span>
        <h1 className="text-sm font-semibold">我的收藏</h1>
      </div>

      {error && (
        <div className="bg-[#2d0a0a] border border-[#5c1414] rounded-lg p-4 text-[#ff6b6b] text-sm mb-4">
          ⚠️ {error}
        </div>
      )}

      <BookmarksGrid initialVideos={videos} />
      {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} basePath="/me/bookmarks" />}
    </div>
  );
}
