"use client";

import { useEffect } from "react";
import { Crown } from "lucide-react";
import confetti from "canvas-confetti";
import { Player } from "@/lib/types";

interface RankingEntry {
  player: Player;
  totalScore: number;
  rank: number;
}

interface WinnerPodiumProps {
  rankings: RankingEntry[];
  shouldAnimate: boolean;
}

function formatScore(score: number): string {
  if (score > 0) return `+${score}`;
  return String(score);
}

function scoreColor(score: number): string {
  if (score > 0) return "text-emerald-400";
  if (score < 0) return "text-rose-400";
  return "text-slate-500";
}

export function WinnerPodium({ rankings, shouldAnimate }: WinnerPodiumProps) {
  // Fire confetti after 1st place animation completes
  useEffect(() => {
    if (!shouldAnimate || rankings.length < 2) return;
    const timer = setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { x: 0.3, y: 0.6 },
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { x: 0.7, y: 0.6 },
        disableForReducedMotion: true,
      });
    }, 2100);
    return () => clearTimeout(timer);
  }, [shouldAnimate, rankings.length]);

  // Edge case: 1 player
  if (rankings.length < 2) {
    const solo = rankings[0];
    if (!solo) return null;
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-white">{solo.player.name}</h2>
        <p className={`text-xl font-bold mt-1 tabular-nums ${scoreColor(solo.totalScore)}`}>
          {formatScore(solo.totalScore)} points
        </p>
      </div>
    );
  }

  // 2-player: winner spotlight
  if (rankings.length === 2) {
    return <TwoPlayerSpotlight rankings={rankings} shouldAnimate={shouldAnimate} />;
  }

  // 3+ players: podium layout
  return <PodiumLayout rankings={rankings} shouldAnimate={shouldAnimate} />;
}

function TwoPlayerSpotlight({
  rankings,
  shouldAnimate,
}: WinnerPodiumProps) {
  const winner = rankings[0];
  const runnerUp = rankings[1];
  const animClass = shouldAnimate ? "podium-enter podium-1st" : "podium-instant";

  return (
    <div className="text-center py-10 relative">
      {/* Ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-48 h-48 rounded-full bg-amber-400/10 blur-[60px]" />
      </div>

      <div className={`relative z-10 ${animClass}`}>
        <div className="animate-bounce-slow mb-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 mx-auto flex items-center justify-center shadow-xl shadow-amber-500/30">
            <Crown className="h-10 w-10 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          {winner.player.name}
        </h2>
        <p className={`text-2xl font-bold mt-2 tabular-nums ${scoreColor(winner.totalScore)}`}>
          {formatScore(winner.totalScore)} points
        </p>
        <p className="text-sm text-amber-400/80 mt-1 font-semibold uppercase tracking-wider">
          Champion
        </p>
      </div>

      {/* Runner-up */}
      <div className="mt-6 text-slate-400">
        <p className="text-base font-medium">{runnerUp.player.name}</p>
        <p className={`text-lg font-bold tabular-nums ${scoreColor(runnerUp.totalScore)}`}>
          {formatScore(runnerUp.totalScore)} points
        </p>
      </div>
    </div>
  );
}

function PodiumLayout({ rankings, shouldAnimate }: WinnerPodiumProps) {
  const first = rankings[0];
  const second = rankings[1];
  const third = rankings[2];
  const rest = rankings.slice(3);

  const getAnimClass = (place: "1st" | "2nd" | "3rd") =>
    shouldAnimate ? `podium-enter podium-${place}` : "podium-instant";

  return (
    <div className="py-6">
      {/* Podium: visual order is [2nd, 1st, 3rd] */}
      <div className="flex items-end justify-center gap-2 px-4">
        {/* 2nd Place */}
        <div className={`flex-1 max-w-[120px] text-center ${getAnimClass("2nd")}`}>
          <p className="text-sm font-bold text-white truncate px-1">{second.player.name}</p>
          <p className={`text-sm font-bold tabular-nums ${scoreColor(second.totalScore)}`}>
            {formatScore(second.totalScore)}
          </p>
          <div className="mt-2 h-16 bg-slate-400 rounded-t-lg flex items-center justify-center">
            <span className="text-2xl font-extrabold text-white">2</span>
          </div>
        </div>

        {/* 1st Place */}
        <div className={`flex-1 max-w-[120px] text-center ${getAnimClass("1st")}`}>
          <Crown className="h-6 w-6 text-amber-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-white truncate px-1">{first.player.name}</p>
          <p className={`text-sm font-bold tabular-nums ${scoreColor(first.totalScore)}`}>
            {formatScore(first.totalScore)}
          </p>
          <div className="mt-2 h-24 bg-gradient-to-b from-amber-400 to-orange-500 rounded-t-lg flex items-center justify-center">
            <span className="text-3xl font-extrabold text-white">1</span>
          </div>
        </div>

        {/* 3rd Place */}
        <div className={`flex-1 max-w-[120px] text-center ${getAnimClass("3rd")}`}>
          <p className="text-sm font-bold text-white truncate px-1">{third.player.name}</p>
          <p className={`text-sm font-bold tabular-nums ${scoreColor(third.totalScore)}`}>
            {formatScore(third.totalScore)}
          </p>
          <div className="mt-2 h-10 bg-amber-700 rounded-t-lg flex items-center justify-center">
            <span className="text-xl font-extrabold text-white">3</span>
          </div>
        </div>
      </div>

      {/* 4th+ players */}
      {rest.length > 0 && (
        <div className="mt-4 px-4 space-y-1">
          {rest.map((entry) => (
            <div
              key={entry.player.id}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/40"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-500 tabular-nums w-5">
                  {entry.rank}
                </span>
                <span className="text-sm font-medium text-slate-300 truncate">
                  {entry.player.name}
                </span>
              </div>
              <span className={`text-sm font-bold tabular-nums ${scoreColor(entry.totalScore)}`}>
                {formatScore(entry.totalScore)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
