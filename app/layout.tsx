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
    <html lang="zh-CN" style={{ colorScheme: "dark" }}>
      <body
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-primary)",
          color: "var(--text-primary)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <Suspense fallback={null}>
          <Header />
        </Suspense>
        <main style={{ flex: 1 }}>
          {children}
        </main>
        <Suspense fallback={null}>
          <MobileNav />
        </Suspense>
        <style>{`
          @media (max-width: 640px) {
            main { padding-bottom: 64px; }
          }
        `}</style>
      </body>
    </html>
  );
}
