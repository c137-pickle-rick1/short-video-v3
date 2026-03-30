interface Props {
  data: { date: string; count: number }[];
}

const MONTHS = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
const DAY_LABELS: Record<number, string> = { 1: "一", 3: "三", 5: "五" };

function cellColor(count: number): string {
  if (count === 0) return "#ffffff10";
  if (count <= 2) return "#e91c7840";
  if (count <= 5) return "#e91c7870";
  if (count <= 10) return "#e91c78b0";
  return "#e91c78";
}

function localIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const CELL = 10;

export default function WatchHeatmap({ data }: Props) {
  const countMap = new Map(data.map((d) => [d.date, d.count]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 52 * 7);
  start.setDate(start.getDate() - start.getDay());

  type Cell = { iso: string; count: number };
  const weeks: (Cell | null)[][] = [];
  const cursor = new Date(start);

  while (cursor <= today) {
    const week: (Cell | null)[] = [];
    for (let i = 0; i < 7; i++) {
      if (cursor <= today) {
        const iso = localIso(cursor);
        week.push({ iso, count: countMap.get(iso) ?? 0 });
      } else {
        week.push(null);
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  // Build month header spans: each entry = { label, colspan }
  const monthSpans: { label: string; colSpan: number }[] = [];
  let prevMonth = -1;
  for (const week of weeks) {
    const firstCell = week.find((c) => c !== null);
    const m = firstCell ? new Date(firstCell.iso).getMonth() : prevMonth;
    if (m !== prevMonth) {
      monthSpans.push({ label: MONTHS[m], colSpan: 1 });
      prevMonth = m;
    } else {
      monthSpans[monthSpans.length - 1].colSpan++;
    }
  }

  const totalVideos = data.reduce((s, d) => s + d.count, 0);
  const activeDays = data.filter((d) => d.count > 0).length;

  return (
    <div className="bg-bg-card border border-border rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-text-primary">看片热力图</h2>
        <span className="text-xs text-text-secondary">
          过去一年 {totalVideos} 次观看 · {activeDays} 天
        </span>
      </div>

      <div className="overflow-x-auto">
        <table style={{ borderCollapse: "separate", borderSpacing: 3 }}>
          <thead>
            <tr>
              <td style={{ width: 28 }} />
              {monthSpans.map((span, i) => (
                <td
                  key={i}
                  colSpan={span.colSpan}
                  style={{ fontSize: 10, color: "#666", padding: 0, textAlign: "left" }}
                >
                  {span.colSpan >= 2 ? span.label : ""}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 7 }, (_, dayIndex) => (
              <tr key={dayIndex}>
                <td style={{ fontSize: 9, lineHeight: `${CELL}px`, color: "#555", textAlign: "right", paddingRight: 4, width: 28 }}>
                  {DAY_LABELS[dayIndex] ?? ""}
                </td>
                {weeks.map((week, wi) => {
                  const cell = week[dayIndex];
                  return cell ? (
                    <td
                      key={wi}
                      title={`${cell.iso}：${cell.count > 0 ? `看了 ${cell.count} 个视频` : "暂无记录"}`}
                      style={{
                        width: CELL,
                        height: CELL,
                        padding: 0,
                        borderRadius: 2,
                        backgroundColor: cellColor(cell.count),
                        lineHeight: 0,
                        fontSize: 0,
                      }}
                    />
                  ) : (
                    <td key={wi} style={{ width: CELL, height: CELL, padding: 0, lineHeight: 0, fontSize: 0 }} />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[10px] text-text-muted">少</span>
        {([0, 2, 5, 10, 15] as const).map((n) => (
          <div
            key={n}
            style={{ width: CELL, height: CELL, borderRadius: 2, backgroundColor: cellColor(n) }}
          />
        ))}
        <span className="text-[10px] text-text-muted">多</span>
      </div>
    </div>
  );
}
