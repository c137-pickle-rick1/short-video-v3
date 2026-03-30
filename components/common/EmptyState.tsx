interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
}

export default function EmptyState({ icon = "📭", title, description }: EmptyStateProps) {
  return (
    <div className="bg-bg-card border border-border rounded-xl px-4 py-5 flex flex-col items-center justify-center gap-2 text-center">
      <div
        aria-hidden="true"
        className="w-10 h-10 rounded-full grid place-items-center bg-accent-dim text-accent text-lg leading-none"
      >
        {icon}
      </div>
      <div className="text-[0.95rem] font-semibold text-text-primary">{title}</div>
      {description ? (
        <div className="text-[0.8125rem] text-text-secondary max-w-[320px]">{description}</div>
      ) : null}
    </div>
  );
}