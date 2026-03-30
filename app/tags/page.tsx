import Link from "next/link";
import { getTags } from "@/lib/server/queries/tag";
import type { Tag } from "@/lib/types";

export const metadata = { title: "标签" };

export default async function TagsPage() {
  let tags: Tag[] = [];
  let error = null;

  try {
    tags = await getTags();
  } catch (e) {
    error = e instanceof Error ? e.message : "加载失败";
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 pt-5 pb-12">
      <h1 className="text-xl font-bold mb-5">标签</h1>

      {error && (
        <div className="bg-[#2d0a0a] border border-[#5c1414] rounded-lg p-4 text-[#ff6b6b] text-sm mb-4">
          ⚠️ {error}
        </div>
      )}

      {tags.length === 0 && !error && (
        <p className="text-text-muted text-center p-12">暂无标签</p>
      )}

      <div className="flex flex-wrap gap-2.5">
        {tags.map((tag) => (
          <Link
            key={tag.id}
            href={`/tags/${encodeURIComponent(tag.slug)}`}
            className="inline-flex items-center gap-1.5 py-[7px] px-4 bg-bg-card border border-border rounded-[20px] text-sm text-text-primary transition-colors hover:border-border-light"
          >
            <span className="text-accent">#</span>
            {tag.name}
            <span className="bg-bg-hover rounded-[10px] px-[7px] py-px text-xs text-text-muted">
              {tag.videoCount}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
