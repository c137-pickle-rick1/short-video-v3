import type React from "react";

export default function VideoDetailLoading() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 py-5">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

        {/* ── Left column ── */}
        <div>
          {/* Player — same container/border-radius as VideoPlayer */}
          <div className="relative bg-black rounded-[10px] overflow-hidden max-h-[75vh] pb-[56.25%] animate-pulse" />

          {/* Reaction buttons just below player */}
          <div className="flex gap-2 mt-3 mb-3 flex-wrap justify-center">
            <div className="w-[92px] h-[34px] bg-bg-card rounded-[7px] animate-pulse" />
            <div className="w-[92px] h-[34px] bg-bg-card rounded-[7px] animate-pulse" />
          </div>

          {/* Title + author row */}
          <div className="mt-3.5">
            {/* h1 title */}
            <div className="w-[55%] h-5 bg-bg-card rounded-md mb-2.5 animate-pulse" />

            {/* Author row */}
            <div className="flex items-center justify-between flex-wrap gap-2.5 mb-4">
              {/* Author: avatar + name + date */}
              <div className="flex items-center gap-2">
                <div className="w-[34px] h-[34px] bg-bg-card rounded-full shrink-0 animate-pulse" />
                <div>
                  <div className="w-[90px] h-[13px] bg-bg-card rounded-md mb-1.5 animate-pulse" />
                  <div className="w-[55px] h-[11px] bg-bg-card rounded-md animate-pulse" />
                </div>
              </div>
              <div className="w-[94px] h-[34px] bg-bg-card rounded-[18px] shrink-0 animate-pulse" />
            </div>

            {/* Comments heading */}
            <div className="w-[100px] h-4 bg-bg-card rounded-md mb-4 animate-pulse" />
            {/* Comment input row */}
            <div className="flex gap-2.5 mb-5">
              <div className="w-8 h-8 bg-bg-card rounded-full shrink-0 animate-pulse" />
              <div className="flex-1 h-9 bg-bg-card rounded-lg animate-pulse" />
            </div>
          </div>
        </div>

        {/* ── Right column: related videos ── */}
        <aside>
          {/* Heading */}
          <div className="w-20 h-4 bg-bg-card rounded-md mb-3 animate-pulse" />
          {/* VideoCards — square thumb + title + author row */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-bg-card rounded-lg overflow-hidden border border-border">
                {/* Square thumbnail */}
                <div className="pb-[100%] bg-bg-secondary animate-pulse" />
                {/* Info */}
                <div className="px-3 pt-2.5 pb-3">
                  <div className="w-[90%] h-3.5 bg-bg-card rounded mb-2 animate-pulse" />
                  <div className="w-3/5 h-3.5 bg-bg-card rounded animate-pulse" />
                  {/* Author row */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-[18px] h-[18px] bg-bg-card rounded-full shrink-0 animate-pulse" />
                    <div className="w-[60px] h-3 bg-bg-card rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
