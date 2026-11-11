import React from "react";
const COLORS = ["#3983f6", "#9865f4", "#0ebc8f", "#f5a000", "#f05267"];
export const chartColors = COLORS;
export function Bars({
  data,
  value = "count",
  label = "date",
  color = "#4387f4",
  height = 200,
}) {
  const W = 780,
    H = height,
    p = 32,
    inner = W - p * 2,
    max = Math.max(1, ...data.map((d) => Number(d[value]) || 0));
  const step = inner / Math.max(1, data.length);
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="chart"
      role="img"
      aria-label="Biểu đồ cột theo thời gian"
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <line
            x1={p}
            y1={H - 28 - (i * (H - 52)) / 4}
            x2={W - 8}
            y2={H - 28 - (i * (H - 52)) / 4}
            stroke="#e3eaf4"
          />
          <text x={p - 8} y={H - 24 - (i * (H - 52)) / 4} textAnchor="end">
            {Number(((max * i) / 4).toFixed(1))}
          </text>
        </g>
      ))}
      {data.map((d, i) => {
        const h = ((d[value] || 0) / max) * (H - 52);
        return (
          <g key={i}>
            <rect
              x={p + i * step + step * 0.15}
              y={H - 28 - h}
              width={Math.max(1, step * 0.7)}
              height={h}
              rx={data.length < 20 ? 4 : 1}
              fill={color}
            >
              <title>
                {d[label]}: {d[value]}
              </title>
            </rect>
            {(i % Math.max(1, Math.floor(data.length / 6)) === 0 ||
              i === data.length - 1) && (
              <text x={p + i * step + step / 2} y={H - 7} textAnchor="middle">
                {String(d[label]).length > 5
                  ? String(d[label]).slice(5)
                  : String(d[label])}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
export function Lines({ data, series, height = 220, label = "date" }) {
  const W = 780,
    H = height,
    p = 32,
    max = Math.max(1, ...data.flatMap((d) => series.map((s) => d[s.key] || 0)));
  const x = (i) => p + (i * (W - p - 18)) / Math.max(1, data.length - 1),
    y = (v) => H - 28 - ((v || 0) / max) * (H - 52);
  return (
    <>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="chart"
        role="img"
        aria-label="Biểu đồ xu hướng"
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <line
              x1={p}
              y1={y((max * i) / 4)}
              x2={W - 10}
              y2={y((max * i) / 4)}
              stroke="#e3eaf4"
            />
            <text x={p - 7} y={y((max * i) / 4) + 4} textAnchor="end">
              {Number(((max * i) / 4).toFixed(1))}
            </text>
          </g>
        ))}
        {series.map((s, si) => (
          <g key={s.key}>
            <polyline
              points={data.map((d, i) => `${x(i)},${y(d[s.key])}`).join(" ")}
              fill="none"
              stroke={s.color || COLORS[si]}
              strokeWidth="2.5"
            />
            {data.map((d, i) => (
              <circle
                key={i}
                cx={x(i)}
                cy={y(d[s.key])}
                r="3"
                fill={s.color || COLORS[si]}
              >
                <title>
                  {d[label]} · {s.name}: {d[s.key] || 0}
                </title>
              </circle>
            ))}
          </g>
        ))}
        {data
          .filter((_, i) => i % Math.max(1, Math.floor(data.length / 6)) === 0)
          .map((d) => (
            <text
              key={d[label]}
              x={x(data.indexOf(d))}
              y={H - 6}
              textAnchor="middle"
            >
              {String(d[label]).length > 5
                ? String(d[label]).slice(5)
                : String(d[label])}
            </text>
          ))}
      </svg>
      <div className="legend">
        {series.map((s, i) => (
          <span key={s.key}>
            <i style={{ background: s.color || COLORS[i] }} />
            {s.name}
          </span>
        ))}
      </div>
    </>
  );
}
export function Weekly({ data }) {
  const W = 700,
    H = 220,
    p = 36,
    maxC = Math.max(1, ...data.map((d) => d.count)),
    maxX = Math.max(20, ...data.map((d) => d.xp)),
    step = (W - p * 2) / 8,
    y = (v, m) => H - 28 - (v / m) * (H - 52);
  return (
    <>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="chart"
        role="img"
        aria-label="Lượt nộp theo tuần và XP"
      >
        <text x="8" y="14" fill="#4387f4">
          Lượt nộp
        </text>
        <text x={W - 20} y="14" textAnchor="end" fill="#9865f4">
          XP
        </text>
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <line
              x1={p}
              x2={W - p}
              y1={y((i * maxC) / 4, maxC)}
              y2={y((i * maxC) / 4, maxC)}
              stroke="#e3eaf4"
            />
            <text x={p - 8} y={y((i * maxC) / 4, maxC) + 4} textAnchor="end">
              {Number(((i * maxC) / 4).toFixed(1))}
            </text>
            <text x={W - p + 6} y={y((i * maxC) / 4, maxC) + 4}>
              {Math.round((i * maxX) / 4)}
            </text>
          </g>
        ))}
        {data.map((d, i) => (
          <g key={i}>
            <rect
              x={p + i * step + step * 0.26}
              y={y(d.count, maxC)}
              width={step * 0.48}
              height={H - 28 - y(d.count, maxC)}
              fill="#4387f4"
              rx="4"
            >
              <title>
                {d.label}: {d.count} lượt nộp, {d.xp} XP
              </title>
            </rect>
            <text x={p + (i + 0.5) * step} y={H - 8} textAnchor="middle">
              {d.label.slice(5)}
            </text>
          </g>
        ))}
        <polyline
          points={data
            .map((d, i) => `${p + (i + 0.5) * step},${y(d.xp, maxX)}`)
            .join(" ")}
          fill="none"
          stroke="#9865f4"
          strokeWidth="2.5"
        />
        {data.map((d, i) => (
          <circle
            key={i}
            cx={p + (i + 0.5) * step}
            cy={y(d.xp, maxX)}
            r="4"
            fill="#9865f4"
          >
            <title>{d.xp} XP</title>
          </circle>
        ))}
      </svg>
      <div className="legend">
        <span>
          <i style={{ background: "#4387f4" }} />
          Lượt nộp (trục trái)
        </span>
        <span>
          <i style={{ background: "#9865f4" }} />
          XP mới (trục phải)
        </span>
      </div>
    </>
  );
}
export function Donut({ data }) {
  const total = data.reduce((a, b) => a + b.value, 0);
  let offset = 0;
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 170 170" role="img" aria-label="Phân bố lỗi">
        <circle
          cx="85"
          cy="85"
          r="61"
          fill="none"
          stroke="#edf2f7"
          strokeWidth="23"
        />
        {data.map((d, i) => {
          const len = total ? (d.value / total) * 383.27 : 0,
            off = offset;
          offset += len;
          return (
            <circle
              key={i}
              cx="85"
              cy="85"
              r="61"
              fill="none"
              stroke={d.color || COLORS[i]}
              strokeWidth="23"
              strokeDasharray={`${len} ${383.27 - len}`}
              strokeDashoffset={-off}
              transform="rotate(-90 85 85)"
            >
              <title>
                {d.name}: {d.value}
              </title>
            </circle>
          );
        })}
        <text x="85" y="84" textAnchor="middle" className="donut-number">
          {total}
        </text>
        <text x="85" y="105" textAnchor="middle">
          lượt lỗi
        </text>
      </svg>
      <div className="donut-key">
        {data.map((d, i) => (
          <div key={i}>
            <div className="row between">
              <span>
                <i style={{ background: d.color || COLORS[i] }} />
                {d.name}
              </span>
              <b>
                {d.value} · {total ? Math.round((d.value / total) * 100) : 0}%
              </b>
            </div>
            <div className="progress-track">
              <div
                style={{
                  width: `${total ? (d.value / total) * 100 : 0}%`,
                  background: d.color || COLORS[i],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export function Radar({ data }) {
  const values = data.slice(0, 6),
    N = values.length,
    cx = 190,
    cy = 145,
    r = 102;
  const pt = (i, v) => [
    cx + Math.sin((i * 2 * Math.PI) / N) * r * v,
    cy - Math.cos((i * 2 * Math.PI) / N) * r * v,
  ];
  return (
    <svg
      viewBox="0 0 380 295"
      className="radar"
      role="img"
      aria-label="Mức độ hoàn thành các kỹ năng"
    >
      {[0.25, 0.5, 0.75, 1].map((v) => (
        <polygon
          key={v}
          points={values.map((_, i) => pt(i, v).join(",")).join(" ")}
          fill="none"
          stroke="#dde5f0"
        />
      ))}
      {values.map((d, i) => (
        <g key={d.name}>
          <line
            x1={cx}
            y1={cy}
            x2={pt(i, 1)[0]}
            y2={pt(i, 1)[1]}
            stroke="#dde5f0"
          />
          <text
            x={pt(i, 1.25)[0]}
            y={pt(i, 1.25)[1]}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {d.title
              .split(" &")[0]
              .replace("Câu lệnh ", "")
              .replace("Giới thiệu", "Nhập xuất")}
          </text>
        </g>
      ))}
      <polygon
        points={values.map((d, i) => pt(i, d.value / 100).join(",")).join(" ")}
        fill="#8b5cf640"
        stroke="#8b5cf6"
        strokeWidth="2.5"
      />
      {values.map((d, i) => (
        <circle
          key={i}
          cx={pt(i, d.value / 100)[0]}
          cy={pt(i, d.value / 100)[1]}
          r="3"
          fill="#8b5cf6"
        >
          <title>
            {d.title}: {d.value}%
          </title>
        </circle>
      ))}
    </svg>
  );
}
