import type React from "react";

export default function VideoDetailLoading() {
  const S = {
    block: (w: string, h: string | number, extra?: React.CSSProperties): React.CSSProperties => ({
      width: w, height: h, background: "var(--bg-card)", borderRadius: "6px",
      animation: "pulse 1.5s ease-in-out infinite", flexShrink: 0, ...extra,
    }),
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "1.25rem 1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }} className="video-detail-layout">

        {/* ── Left column ── */}
        <div>
          {/* Player — same container/border-radius as VideoPlayer */}
          <div style={{
            position: "relative", background: "#000", borderRadius: "10px",
            overflow: "hidden", maxHeight: "75vh", paddingBottom: "56.25%",
            animation: "pulse 1.5s ease-in-out infinite",
          }} />

          {/* Reaction buttons just below player */}
          <div style={{ display: "flex", gap: "8px", marginTop: "12px", marginBottom: "12px", flexWrap: "wrap", justifyContent: "center" }}>
            <div style={S.block("92px", 34, { borderRadius: "7px" })} />
            <div style={S.block("92px", 34, { borderRadius: "7px" })} />
          </div>

          {/* Title + author row */}
          <div style={{ marginTop: "14px" }}>
            {/* h1 title */}
            <div style={S.block("55%", 20, { marginBottom: "10px" })} />

            {/* Author row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
              {/* Author: avatar + name + date */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={S.block("34px", 34, { borderRadius: "50%" })} />
                <div>
                  <div style={S.block("90px", 13, { marginBottom: "6px" })} />
                  <div style={S.block("55px", 11)} />
                </div>
              </div>
              <div style={S.block("94px", 34, { borderRadius: "18px" })} />
            </div>

            {/* Comments heading */}
            <div style={S.block("100px", 16, { marginBottom: "16px" })} />
            {/* Comment input row */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <div style={S.block("32px", 32, { borderRadius: "50%" })} />
              <div style={{ ...S.block("100%", 36, { borderRadius: "8px" }), flex: 1 }} />
            </div>
          </div>
        </div>

        {/* ── Right column: related videos ── */}
        <aside>
          {/* Heading */}
          <div style={S.block("80px", 16, { marginBottom: "12px" })} />
          {/* VideoCards — square thumb + title + author row */}
          <div className="related-videos-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: "var(--bg-card)", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border)" }}>
                {/* Square thumbnail */}
                <div style={{ paddingBottom: "100%", background: "var(--bg-secondary)", animation: "pulse 1.5s ease-in-out infinite" }} />
                {/* Info */}
                <div style={{ padding: "10px 12px 12px" }}>
                  <div style={S.block("90%", 14, { marginBottom: "8px" })} />
                  <div style={S.block("60%", 14)} />
                  {/* Author row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
                    <div style={S.block("18px", 18, { borderRadius: "50%" })} />
                    <div style={S.block("60px", 12)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        .related-videos-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        @media (min-width: 1024px) {
          .video-detail-layout {
            grid-template-columns: 1fr 340px !important;
          }
          .related-videos-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
