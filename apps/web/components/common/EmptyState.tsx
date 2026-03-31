import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  framed?: boolean;
}

export default function EmptyState({
  icon,
  title,
  description,
  framed = true,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2.5 text-center ${framed ? "bg-bg-card border border-border rounded-xl px-4 py-5" : "py-5"}`}
    >
      {icon ? (
        <div
          aria-hidden="true"
          className="w-12 h-12 rounded-full grid place-items-center bg-accent-dim text-accent leading-none [&_svg]:w-6 [&_svg]:h-6"
        >
          {icon}
        </div>
      ) : null}
      <div className="flex flex-col items-center gap-0.5">
        <div className="text-[0.95rem] font-semibold text-text-primary">{title}</div>
        {description ? (
          <div className="text-[0.8125rem] text-text-secondary max-w-[320px]">{description}</div>
        ) : null}
      </div>
    </div>
  );
}
