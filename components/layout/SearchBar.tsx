"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";

export default function SearchBar({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form action="/" method="GET" style={{ position: "relative", width: "100%" }}>
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="搜索视频、关键词"
        style={{
          padding: "6px 12px 6px 36px",
          fontSize: "0.875rem",
          height: "36px",
        }}
      />
      <MagnifyingGlass
        size={16}
        weight="regular"
        style={{
          position: "absolute",
          left: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--text-muted)",
          pointerEvents: "none",
        }}
      />
    </form>
  );
}
