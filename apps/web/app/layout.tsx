import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "短视频",
  description: "精彩短视频内容平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="min-h-dvh flex flex-col bg-bg-primary text-text-primary pb-[env(safe-area-inset-bottom)]">
        <Suspense fallback={null}>
          <Header />
        </Suspense>
        <main className="flex-1 max-sm:pb-16">
          {children}
        </main>
        <Suspense fallback={null}>
          <MobileNav />
        </Suspense>
      </body>
    </html>
  );
}
