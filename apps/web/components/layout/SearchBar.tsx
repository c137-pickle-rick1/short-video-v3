"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react";

export default function SearchBar({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form action="/" method="GET" className="relative w-full">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="搜索视频、关键词"
        className="!pl-9 pr-3 py-1.5 text-sm h-9"
      />
      <MagnifyingGlassIcon
        size={16}
        weight="regular"
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
      />
    </form>
  );
}
