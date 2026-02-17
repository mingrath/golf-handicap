"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface WinRateData {
  name: string;
  winRate: number;
  wins: number;
  games: number;
}

const chartConfig: ChartConfig = {
  winRate: {
    label: "Win Rate",
    color: "hsl(142, 71%, 45%)",
  },
};

export function WinRateChart({ data }: { data: WinRateData[] }) {
  return (
    <div className="glass-card p-4">
      <h2 className="font-bold text-foreground mb-3">Win Rates</h2>
      <ChartContainer config={chartConfig} className="h-[200px] w-full">
        <BarChart data={data}>
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            className="stroke-border"
          />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ className: "fill-muted-foreground", fontSize: 12 }}
          />
          <YAxis
            domain={[0, 1]}
            tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
            tickLine={false}
            axisLine={false}
            tick={{ className: "fill-muted-foreground", fontSize: 12 }}
            width={40}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) =>
                  `${Math.round(Number(value) * 100)}%`
                }
              />
            }
          />
          <Bar
            dataKey="winRate"
            fill="var(--color-winRate)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
