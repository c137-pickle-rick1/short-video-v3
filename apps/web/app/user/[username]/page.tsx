import { getPublicProfile } from "@/lib/server/queries/user";
import { resolveViewerUserIdFromCookieToken } from "@/lib/server/auth";
import VideoGrid from "@/components/video/VideoGrid";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProfileFollowButton from "@/components/profile/ProfileFollowButton";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);

  const jar = await cookies();
  const token = jar.get("sv_session")?.value ?? null;
  const viewerUserId = token ? await resolveViewerUserIdFromCookieToken(token) : null;

  const profile = await getPublicProfile(decodedUsername, viewerUserId);
  if (!profile) notFound();

  const isOwnProfile = viewerUserId === profile.userId;

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-5">
      {/* Profile header */}
      <div className="bg-bg-card border border-border rounded-xl p-6 flex items-start gap-5 flex-wrap mb-6">
        <Image
          src={profile.imageUrl}
          alt={profile.name}
          width={80}
          height={80}
          className="rounded-full object-cover shrink-0"
          unoptimized
        />

        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-3 flex-wrap mb-1.5">
            <h1 className="text-xl font-bold">{profile.name}</h1>
            <span className="text-text-muted text-sm">{profile.handle}</span>
          </div>

          {profile.bio && (
            <p className="text-text-secondary text-sm leading-relaxed mb-3">
              {profile.bio}
            </p>
          )}

          <div className="flex gap-5 text-sm text-text-secondary mb-3">
            <span><strong className="text-text-primary">{profile.videoCount}</strong> 视频</span>
            <span><strong className="text-text-primary">{profile.followerCount}</strong> 粉丝</span>
            <span><strong className="text-text-primary">{profile.followingCount}</strong> 关注</span>
          </div>

          {isOwnProfile ? (
            <Link href="/me" className="inline-flex items-center gap-1.5 rounded-md border border-border-light bg-transparent px-4 py-1.5 text-sm font-medium text-text-secondary transition-all hover:border-text-muted hover:text-text-primary cursor-pointer">
              编辑资料
            </Link>
          ) : viewerUserId ? (
            <ProfileFollowButton
              targetUserId={profile.userId}
              initialFollowing={profile.isFollowing}
            />
          ) : (
            <Link href="/login" className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-1.5 text-sm font-semibold text-white border-none cursor-pointer transition-colors hover:bg-accent-hover">
              关注
            </Link>
          )}
        </div>
      </div>

      {/* Videos */}
      <h2 className="text-base font-bold mb-3.5">发布的视频</h2>
      <VideoGrid
        videos={profile.videos}
        emptyMessage="暂无公开视频"
        emptyDescription="该用户发布公开视频后，这里会显示作品列表。"
      />
    </div>
  );
}
