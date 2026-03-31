export default function UserProfileLoading() {
  return (
    <div className="max-w-[1100px] mx-auto px-4 py-5">
      <div className="bg-bg-card border border-border rounded-xl p-5 mb-4 text-text-secondary text-[0.9rem]">
        正在打开作者主页...
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[10px] border border-border bg-bg-card h-[180px]"
          />
        ))}
      </div>
    </div>
  );
}
