import Image from "next/image";
import Link from "next/link";
import { SquaresFourIcon } from "@phosphor-icons/react/dist/ssr";
import EmptyState from "@/components/common/EmptyState";
import { getCategoryGroups } from "@/lib/server/queries/category";
import type { Category, CategoryGroup } from "@/lib/types";

export const metadata = { title: "分类" };

export default async function CategoriesPage() {
  const groups = await getCategoryGroups();

  return (
    <main className="max-w-[1400px] mx-auto px-4 pt-6 pb-12">
      {groups.length === 0 && (
        <EmptyState
          icon={<SquaresFourIcon size={20} weight="regular" />}
          title="暂无分类"
          description="分类内容完善后，这里会显示可浏览的分类。"
        />
      )}
      {groups.map((group: CategoryGroup) =>
        group.items.length === 0 ? null : (
          <section key={group.id} className="mb-10">
            <h2 className="text-lg font-bold text-text-secondary uppercase tracking-wider mb-4 pb-2 border-b-2 border-accent inline-block">{group.name}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-2.5 lg:gap-4">
              {group.items.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </section>
        )
      )}
    </main>
  );
}

function CategoryCard({ category }: { category: Category }) {
  return (
    <Link href={`/categories/${category.slug}`} className="relative aspect-video rounded-lg overflow-hidden block bg-[#1a1a1a] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(233,28,120,0.35)]">
      {category.coverUrl ? (
        <Image
          src={category.coverUrl}
          alt={category.name}
          fill
          sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, (max-width: 1100px) 25vw, 20vw"
          className="object-cover"
          unoptimized
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#1e1e2e] to-[#2a1a2e]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent flex flex-col justify-end p-2.5 px-3">
        <div className="text-[0.95rem] font-bold text-white leading-tight mb-1">{category.name}</div>
        <div className="text-[0.72rem] text-white/65">{category.videoCount} 个视频</div>
      </div>
    </Link>
  );
}
