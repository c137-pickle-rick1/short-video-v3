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
    <header
      style={{
        backgroundColor: "#000000",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0 1rem",
          height: "56px",
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontWeight: 900,
              fontStyle: "italic",
              fontSize: "1.375rem",
              letterSpacing: "-1px",
              background: "linear-gradient(90deg, #e91c78 0%, #ff6eb4 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              lineHeight: 1,
            }}
          >
            短视频
          </span>
        </Link>

        {/* Nav Links */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            flexShrink: 0,
          }}
          className="hidden-mobile"
        >
          <NavLink href="/">首页</NavLink>
          <NavLink href="/subscriptions">关注</NavLink>
          <NavLink href="/rankings">排行榜</NavLink>
          <NavLink href="/categories">分类</NavLink>
          <NavLink href="/tags">标签</NavLink>
        </nav>

        {/* Search */}
        <div style={{ flex: 1, maxWidth: "400px" }}>
          <SearchBar />
        </div>

        {/* Auth */}
        <div
          style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginLeft: "auto", flexShrink: 0 }}
        >
          {viewerProfile ? (
            <>
              <Link
                href="/me"
                className="nav-link"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  transition: "background 0.15s",
                }}
              >
                <Image
                  src={normalizeAvatarUrl(viewerProfile.avatarUrl, viewerProfile.name, viewerProfile.username)}
                  alt={viewerProfile.name ?? "用户"}
                  width={24}
                  height={24}
                  style={{ borderRadius: "50%", objectFit: "cover" }}
                  unoptimized
                />
                <span style={{ fontSize: "0.875rem", color: "var(--text-primary)", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} className="hidden-mobile">
                  {viewerProfile.name ?? viewerProfile.username ?? "我的账户"}
                </span>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                style={{
                  fontSize: "0.875rem",
                  color: "var(--text-secondary)",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-light)",
                  transition: "all 0.15s",
                }}
              >
                登录
              </Link>
              <Link
                href="/register"
                className="btn-primary"
                style={{ fontSize: "0.875rem", padding: "6px 14px" }}
              >
                注册
              </Link>
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .hidden-mobile { display: none !important; }
        }
      `}</style>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="nav-link"
      style={{
        fontSize: "0.875rem",
        color: "var(--text-secondary)",
        padding: "6px 10px",
        borderRadius: "6px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Link>
  );
}
