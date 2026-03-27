import Image from "next/image";
import Link from "next/link";
import { getCategoryGroups } from "@/lib/server/queries/category";
import type { Category, CategoryGroup } from "@/lib/types";

export const metadata = { title: "分类" };

export default async function CategoriesPage() {
  const groups = await getCategoryGroups();

  return (
    <main className="categories-page">
      {groups.length === 0 && (
        <p className="empty-state">暂无分类</p>
      )}
      {groups.map((group: CategoryGroup) =>
        group.items.length === 0 ? null : (
          <section key={group.id} className="category-group">
            <h2 className="category-group-title">{group.name}</h2>
            <div className="category-grid">
              {group.items.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </section>
        )
      )}
      <style>{`
        .categories-page {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px 16px 48px;
        }
        .empty-state {
          color: var(--text-secondary);
          text-align: center;
          padding: 48px 0;
        }
        .category-group {
          margin-bottom: 40px;
        }
        .category-group-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin: 0 0 16px;
          padding-bottom: 8px;
          border-bottom: 2px solid var(--accent);
          display: inline-block;
        }
        .category-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
        }
        @media (max-width: 1100px) {
          .category-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @media (max-width: 768px) {
          .category-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
        }
        @media (max-width: 480px) {
          .category-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
        }
        .category-card {
          position: relative;
          aspect-ratio: 16 / 9;
          border-radius: 8px;
          overflow: hidden;
          display: block;
          background: #1a1a1a;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .category-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 24px rgba(233, 28, 120, 0.35);
        }
        .category-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .category-card-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #1e1e2e 0%, #2a1a2e 100%);
        }
        .category-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.15) 55%, transparent 100%);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 10px 12px;
        }
        .category-card-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: #fff;
          line-height: 1.2;
          margin-bottom: 4px;
        }
        .category-card-count {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.65);
        }
      `}</style>
    </main>
  );
}

function CategoryCard({ category }: { category: Category }) {
  return (
    <Link href={`/categories/${category.slug}`} className="category-card">
      {category.coverUrl ? (
        <Image
          src={category.coverUrl}
          alt={category.name}
          fill
          sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, (max-width: 1100px) 25vw, 20vw"
          style={{ objectFit: "cover" }}
          unoptimized
        />
      ) : (
        <div className="category-card-placeholder" />
      )}
      <div className="category-card-overlay">
        <div className="category-card-name">{category.name}</div>
        <div className="category-card-count">{category.videoCount} 个视频</div>
      </div>
    </Link>
  );
}
