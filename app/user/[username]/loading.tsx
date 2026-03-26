export default function UserProfileLoading() {
  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.25rem 1rem" }}>
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "16px",
          color: "var(--text-secondary)",
          fontSize: "0.9rem",
        }}
      >
        正在打开作者主页...
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              borderRadius: "10px",
              border: "1px solid var(--border)",
              background: "var(--bg-card)",
              height: "180px",
            }}
          />
        ))}
      </div>
    </div>
  );
}
