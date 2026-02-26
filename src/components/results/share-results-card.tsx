"use client";

import { useState, useEffect } from "react";
import { Share2, Download, Loader2 } from "lucide-react";
import { captureAndShare, canNativeShare } from "@/lib/share";
import { Player } from "@/lib/types";

interface RankingEntry {
  player: Player;
  totalScore: number;
  rank: number;
}

interface ShareResultsCardProps {
  rankings: RankingEntry[];
  numberOfHoles: number;
}

export function ShareResultsCard({ rankings, numberOfHoles }: ShareResultsCardProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isNativeShare, setIsNativeShare] = useState(false);

  useEffect(() => {
    setIsNativeShare(canNativeShare());
  }, []);

  const handleShare = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    try {
      const shareRankings = rankings.map((r) => ({
        playerName: r.player.name,
        totalScore: r.totalScore,
        rank: r.rank,
      }));
      await captureAndShare(shareRankings, numberOfHoles);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="glass-card p-4">
      <button
        className="w-full h-12 rounded-xl text-base font-semibold bg-muted border border-border text-foreground hover:bg-muted/80 active:scale-[0.97] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleShare}
        disabled={isCapturing}
      >
        {isCapturing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Capturing...
          </>
        ) : isNativeShare ? (
          <>
            <Share2 className="h-5 w-5" />
            Share Results
          </>
        ) : (
          <>
            <Download className="h-5 w-5" />
            Save Results
          </>
        )}
      </button>
    </div>
  );
}
