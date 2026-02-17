"use client";

import { useRef, useState, useEffect } from "react";
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

function formatScore(score: number): string {
  if (score > 0) return `+${score}`;
  return String(score);
}

export function ShareResultsCard({ rankings, numberOfHoles }: ShareResultsCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isNativeShare, setIsNativeShare] = useState(false);

  useEffect(() => {
    setIsNativeShare(canNativeShare());
  }, []);

  const winner = rankings[0];

  const handleShare = async () => {
    if (!cardRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      await captureAndShare(cardRef.current);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <>
      {/* Off-screen capturable card */}
      <div
        ref={cardRef}
        style={{
          position: "fixed",
          left: "-9999px",
          top: 0,
          width: "375px",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div
          style={{
            backgroundColor: "#0f172a",
            color: "#f8fafc",
            padding: "32px 24px",
          }}
        >
          {/* Branding */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#f8fafc",
                letterSpacing: "-0.025em",
              }}
            >
              Golf Handicap Scorer
            </div>
            <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>
              {numberOfHoles} holes
            </div>
          </div>

          {/* Winner spotlight */}
          {winner && (
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>
                {/* Unicode crown for reliable capture */}
                &#x1F451;
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "#f8fafc",
                }}
              >
                {winner.player.name}
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: winner.totalScore > 0 ? "#34d399" : winner.totalScore < 0 ? "#fb7185" : "#94a3b8",
                  marginTop: "4px",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatScore(winner.totalScore)} points
              </div>
            </div>
          )}

          {/* Rankings list */}
          <div>
            {rankings.map((entry) => (
              <div
                key={entry.player.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderBottom: "1px solid rgba(148, 163, 184, 0.1)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: 800,
                      color: "#94a3b8",
                      width: "24px",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {entry.rank}
                  </span>
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: 500,
                      color: "#f8fafc",
                    }}
                  >
                    {entry.player.name}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    color:
                      entry.totalScore > 0
                        ? "#34d399"
                        : entry.totalScore < 0
                        ? "#fb7185"
                        : "#94a3b8",
                  }}
                >
                  {formatScore(entry.totalScore)}
                </span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            style={{
              textAlign: "center",
              marginTop: "20px",
              fontSize: "11px",
              color: "#64748b",
            }}
          >
            golfscorer.app
          </div>
        </div>
      </div>

      {/* Visible share button */}
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
    </>
  );
}
