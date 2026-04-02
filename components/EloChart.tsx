"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = { t: string; elo: number };

export function EloChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-plains-muted">No ELO history yet. Resolve some markets.</p>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="t"
            tick={{ fill: "#6b7280", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#1e2433" }}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fill: "#6b7280", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#1e2433" }}
            width={44}
          />
          <Tooltip
            contentStyle={{
              background: "#0c0e14",
              border: "1px solid #1e2433",
              borderRadius: 8,
            }}
            labelStyle={{ color: "#9ca3af" }}
          />
          <Line
            type="monotone"
            dataKey="elo"
            stroke="#8ACC16"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#8ACC16" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
