interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
}

export default function EmptyState({ icon = "📭", title, description }: EmptyStateProps) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "20px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        textAlign: "center",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "999px",
          display: "grid",
          placeItems: "center",
          background: "rgba(233, 28, 120, 0.14)",
          color: "var(--accent)",
          fontSize: "1.1rem",
          lineHeight: 1,
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" }}>{title}</div>
      {description ? (
        <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", maxWidth: "320px" }}>{description}</div>
      ) : null}
    </div>
  );
}