import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { resolveViewerUserIdFromCookieToken } from "@/lib/server/auth";
import { getMyVideos } from "@/lib/server/queries/user";
import CreatorCenterTabs from "@/components/profile/CreatorCenterTabs";

export default async function CreatorCenterPage() {
  const jar = await cookies();
  const token = jar.get("sv_session")?.value ?? null;
  const viewerUserId = token ? await resolveViewerUserIdFromCookieToken(token) : null;
  if (!viewerUserId) redirect("/login?redirect_to=/me/creator");

  const videos = await getMyVideos(viewerUserId);

  return (
    <div className="max-w-[800px] mx-auto px-4 py-5">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h1 className="text-xl font-bold">创作者中心</h1>
        <Link href="/me" className="inline-flex items-center gap-1.5 rounded-md border border-border-light bg-transparent px-3.5 py-2 text-[0.8125rem] font-medium text-text-secondary transition-all hover:border-text-muted hover:text-text-primary cursor-pointer">
          返回个人中心
        </Link>
      </div>

      <CreatorCenterTabs initialVideos={videos} />
    </div>
  );
}
