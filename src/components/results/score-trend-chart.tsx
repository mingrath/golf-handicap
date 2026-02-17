"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Player, PlayerHoleScore } from "@/lib/types";

interface ScoreTrendChartProps {
  players: Player[];
  playerScores: PlayerHoleScore[];
  numberOfHoles: number;
}

export function ScoreTrendChart({
  players,
  playerScores,
  numberOfHoles,
}: ScoreTrendChartProps) {
  const chartData = useMemo(() => {
    const data: Record<string, number>[] = [];
    for (let i = 0; i < numberOfHoles; i++) {
      const hole = i + 1;
      // Only include holes that have been played
      const hasScores = players.some((p) =>
        playerScores.some(
          (s) => s.playerId === p.id && s.holeNumber === hole
        )
      );
      if (!hasScores) continue;

      const entry: Record<string, number> = { hole };
      for (const player of players) {
        const score = playerScores.find(
          (s) => s.playerId === player.id && s.holeNumber === hole
        );
        entry[player.id] = score?.runningTotal ?? 0;
      }
      data.push(entry);
    }
    return data;
  }, [players, playerScores, numberOfHoles]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    const is2Players = players.length === 2;

    // For 2 players, use emerald/rose. For 3+, cycle chart-1 through chart-5.
    const twoPlayerColors = [
      "hsl(142, 71%, 45%)", // emerald
      "hsl(350, 89%, 60%)", // rose
    ];

    players.forEach((player, idx) => {
      config[player.id] = {
        label: player.name,
        color: is2Players
          ? twoPlayerColors[idx]
          : `var(--chart-${(idx % 5) + 1})`,
      };
    });
    return config;
  }, [players]);

  // No scores yet -- render nothing
  if (chartData.length === 0) return null;

  return (
    <div className="glass-card p-4">
      <h2 className="font-bold text-white mb-3">Score Trend</h2>
      <ChartContainer config={chartConfig} className="h-[200px] w-full">
        <LineChart data={chartData}>
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            stroke="rgba(148, 163, 184, 0.15)"
          />
          <XAxis
            dataKey="hole"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "rgba(148, 163, 184, 0.7)", fontSize: 12 }}
            tickFormatter={(v) => `H${v}`}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "rgba(148, 163, 184, 0.7)", fontSize: 12 }}
            width={30}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(value) => `Hole ${value}`}
              />
            }
          />
          {players.map((player) => (
            <Line
              key={player.id}
              type="monotone"
              dataKey={player.id}
              stroke={`var(--color-${player.id})`}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  );
}
