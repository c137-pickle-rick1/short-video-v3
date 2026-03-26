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
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "1.25rem 1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", gap: "0.75rem", flexWrap: "wrap" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>创作者中心</h1>
        <Link href="/me" className="btn-secondary" style={{ padding: "8px 14px", fontSize: "0.8125rem" }}>
          返回个人中心
        </Link>
      </div>

      <CreatorCenterTabs initialVideos={videos} />
    </div>
  );
}
