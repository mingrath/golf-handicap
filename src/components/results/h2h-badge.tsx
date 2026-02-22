"use client";

import { History } from "lucide-react";
import { useH2HRecords } from "@/hooks/use-h2h-records";
import { getH2HForPair } from "@/lib/stats";

interface H2HBadgeProps {
  playerAName: string;
  playerBName: string;
}

export function H2HBadge({ playerAName, playerBName }: H2HBadgeProps) {
  const records = useH2HRecords();

  if (!records || records.length === 0) return null;

  const record = getH2HForPair(records, playerAName, playerBName);
  if (!record || record.gamesPlayed < 2) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50">
      <History className="h-3 w-3 shrink-0" />
      <span>
        All time: {record.playerAWins}-{record.ties}-{record.playerBWins}
        <span className="ml-1 opacity-70">
          ({record.gamesPlayed} game{record.gamesPlayed !== 1 ? "s" : ""})
        </span>
      </span>
    </div>
  );
}
