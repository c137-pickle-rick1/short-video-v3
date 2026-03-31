import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { AUTH_SESSION_COOKIE_NAME, resolveViewerUserIdFromCookieToken } from "@/lib/server/auth";
import { getViewerProfile } from "@/lib/server/queries/video";
import { normalizeAvatarUrl } from "@/lib/server/presenters";
import SearchBar from "./SearchBar";


export default async function Header() {
  let viewerProfile = null;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;
    const viewerUserId = await resolveViewerUserIdFromCookieToken(token);
    if (viewerUserId) {
      viewerProfile = await getViewerProfile(viewerUserId);
    }
  } catch {
    // DB not configured
  }

  return (
    <header className="bg-black border-b border-border sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span
            className="font-black italic text-[1.375rem] -tracking-[1px] leading-none bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(90deg, #e91c78 0%, #ff6eb4 100%)" }}
          >
            短视频
          </span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden sm:flex items-center gap-1 shrink-0">
          <NavLink href="/">首页</NavLink>
          <NavLink href="/subscriptions">关注</NavLink>
          <NavLink href="/rankings">榜单</NavLink>
          <NavLink href="/categories">分类</NavLink>
          <NavLink href="/tags">标签</NavLink>
        </nav>

        {/* Search */}
        <div className="flex-1 max-w-[400px]">
          <SearchBar />
        </div>

        {/* Auth */}
        <div className="flex items-center gap-3 ml-auto shrink-0">
          {viewerProfile ? (
            <>
              <Link
                href="/me"
                className="flex items-center gap-2 px-2 py-1 rounded-md transition-colors hover:bg-bg-hover"
              >
                <Image
                  src={normalizeAvatarUrl(viewerProfile.avatarUrl, viewerProfile.name, viewerProfile.username)}
                  alt={viewerProfile.name ?? "用户"}
                  width={24}
                  height={24}
                  className="rounded-full object-cover"
                  unoptimized
                />
                <span className="hidden sm:inline text-sm text-text-primary max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">
                  {viewerProfile.name ?? viewerProfile.username ?? "我的账户"}
                </span>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-text-secondary px-3.5 py-1.5 rounded-md border border-border-light transition-all hover:border-text-muted hover:text-text-primary"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-md bg-accent text-white border-none cursor-pointer transition-colors hover:bg-accent-hover"
              >
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm text-text-secondary px-2.5 py-1.5 rounded-md whitespace-nowrap transition-[color,background] duration-150 hover:text-accent hover:bg-bg-hover"
    >
      {children}
    </Link>
  );
}
