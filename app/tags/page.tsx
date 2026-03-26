import { getTagList } from "@/lib/server/queries/user";
import Link from "next/link";

export default async function TagsPage() {
  let tags: { tag_name: string; video_count: string }[] = [];
  let error = null;

  try {
    tags = await getTagList();
  } catch (e) {
    error = e instanceof Error ? e.message : "加载失败";
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.25rem 1rem" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.25rem" }}>标签云</h1>

      {error && (
        <div style={{ background: "#2d0a0a", border: "1px solid #5c1414", borderRadius: "8px", padding: "1rem", color: "#ff6b6b", fontSize: "0.875rem", marginBottom: "1rem" }}>
          ⚠️ {error}
        </div>
      )}

      {tags.length === 0 && !error && (
        <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "3rem" }}>暂无标签</p>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {tags.map((tag) => (
          <Link
            key={tag.tag_name}
            href={`/tags/${encodeURIComponent(tag.tag_name)}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 16px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
              fontSize: "0.875rem",
              color: "var(--text-primary)",
              transition: "border-color 0.15s, color 0.15s",
            }}
          >
            <span style={{ color: "var(--accent)" }}>#</span>
            {tag.tag_name}
            <span style={{
              background: "var(--bg-hover)",
              borderRadius: "10px",
              padding: "1px 7px",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
            }}>
              {tag.video_count}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
