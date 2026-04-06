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
            tick={{ fill: "#5c6470", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#d4dce8" }}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fill: "#5c6470", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#d4dce8" }}
            width={44}
          />
          <Tooltip
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #d4dce8",
              borderRadius: 8,
              boxShadow: "0 8px 24px rgba(15,20,25,0.08)",
            }}
            labelStyle={{ color: "#5c6470" }}
          />
          <Line
            type="monotone"
            dataKey="elo"
            stroke="#e8b923"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#e8b923" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
