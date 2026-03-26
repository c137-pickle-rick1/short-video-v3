"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, ChartBar, SquaresFour, UserList, User } from "@phosphor-icons/react";

const NAV_ITEMS = [
  { href: "/", label: "首页", Icon: House },
  { href: "/subscriptions", label: "关注", Icon: UserList },
  { href: "/rankings", label: "排行榜", Icon: ChartBar },
  { href: "/categories", label: "分类", Icon: SquaresFour },
  { href: "/me", label: "我的", Icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#000000",
        borderTop: "1px solid var(--border)",
        zIndex: 50,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      className="mobile-nav"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "10px 0 8px",
              gap: "3px",
              color: isActive ? "var(--accent)" : "var(--text-muted)",
              transition: "color 0.15s",
            }}
          >
            <item.Icon size={22} weight={isActive ? "fill" : "regular"} />
            <span style={{ fontSize: "0.625rem", fontWeight: isActive ? 600 : 400 }}>
              {item.label}
            </span>
          </Link>
        );
      })}

      <style>{`
        .mobile-nav { display: none; }
        @media (max-width: 640px) {
          .mobile-nav { display: flex; }
        }
      `}</style>
    </nav>
  );
}
