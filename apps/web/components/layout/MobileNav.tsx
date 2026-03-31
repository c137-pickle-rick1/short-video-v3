"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, ChartBar, SquaresFour, UserList, User } from "@phosphor-icons/react";

const NAV_ITEMS = [
  { href: "/", label: "首页", Icon: House },
  { href: "/subscriptions", label: "关注", Icon: UserList },
  { href: "/rankings", label: "榜单", Icon: ChartBar },
  { href: "/categories", label: "分类", Icon: SquaresFour },
  { href: "/me", label: "我的", Icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-border z-50 pb-[env(safe-area-inset-bottom)] hidden max-sm:flex">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center pt-2.5 pb-2 gap-0.5 transition-colors duration-150 ${
              isActive ? "text-accent" : "text-text-muted"
            }`}
          >
            <item.Icon size={22} weight={isActive ? "fill" : "regular"} />
            <span className={`text-[0.625rem] ${isActive ? "font-semibold" : "font-normal"}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
