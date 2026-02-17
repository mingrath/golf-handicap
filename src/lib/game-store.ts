"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  GameConfig,
  GameState,
  Player,
  PairHandicap,
  HoleStrokes,
  PairHoleResult,
  PlayerHoleScore,
  PairKey,
} from "./types";
import { generatePairs, distributeHandicapHoles, makePairKey } from "./pairs";
import {
  calculatePairHoleResult,
  calculatePlayerHoleScores,
  getRunningTotals,
} from "./scoring";

interface GameStore extends GameState {
  // Setup actions
  setPlayers: (players: Player[]) => void;
  setNumberOfHoles: (n: number) => void;
  setHandicap: (pairKey: PairKey, value: number) => void;
  setHandicapHoles: (pairKey: PairKey, holes: number[]) => void;
  setTurboHoles: (holes: number[]) => void;
  toggleTurboHole: (hole: number) => void;

  // Initialize handicaps for all pairs
  initializeHandicaps: () => void;

  // Gameplay actions
  submitHoleStrokes: (strokes: HoleStrokes) => void;
  goToHole: (holeNumber: number) => void;
  goToNextHole: () => void;
  goToPreviousHole: () => void;
  completeGame: () => void;

  // Reset
  resetGame: () => void;
  hasActiveGame: () => boolean;
}

const initialState: GameState = {
  config: null,
  currentHole: 1,
  holeStrokes: [],
  pairResults: [],
  playerScores: [],
  isComplete: false,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPlayers: (players) =>
        set((state) => ({
          config: {
            ...state.config!,
            players,
            numberOfHoles: state.config?.numberOfHoles ?? 18,
            handicaps: state.config?.handicaps ?? {},
            turboHoles: state.config?.turboHoles ?? [],
          },
        })),

      setNumberOfHoles: (n) =>
        set((state) => ({
          config: state.config
            ? { ...state.config, numberOfHoles: n }
            : {
                players: [],
                numberOfHoles: n,
                handicaps: {},
                turboHoles: [],
              },
        })),

      setHandicap: (pairKey, value) =>
        set((state) => {
          if (!state.config) return {};
          const existing = state.config.handicaps[pairKey];
          const numberOfHoles = state.config.numberOfHoles;
          const newHandicap: PairHandicap = {
            ...existing,
            pairKey,
            value,
            handicapHoles: [],
          };
          return {
            config: {
              ...state.config,
              handicaps: {
                ...state.config.handicaps,
                [pairKey]: newHandicap,
              },
            },
          };
        }),

      setHandicapHoles: (pairKey, holes) =>
        set((state) => {
          if (!state.config) return {};
          const existing = state.config.handicaps[pairKey];
          if (!existing) return {};
          return {
            config: {
              ...state.config,
              handicaps: {
                ...state.config.handicaps,
                [pairKey]: { ...existing, handicapHoles: holes },
              },
            },
          };
        }),

      setTurboHoles: (holes) =>
        set((state) => {
          if (!state.config) return {};
          return {
            config: { ...state.config, turboHoles: holes },
          };
        }),

      toggleTurboHole: (hole) =>
        set((state) => {
          if (!state.config) return {};
          const current = state.config.turboHoles;
          const newTurbo = current.includes(hole)
            ? current.filter((h) => h !== hole)
            : [...current, hole].sort((a, b) => a - b);
          return {
            config: { ...state.config, turboHoles: newTurbo },
          };
        }),

      initializeHandicaps: () =>
        set((state) => {
          if (!state.config) return {};
          const pairs = generatePairs(state.config.players);
          const handicaps: Record<PairKey, PairHandicap> = {};
          for (const pair of pairs) {
            handicaps[pair.pairKey] = state.config.handicaps[pair.pairKey] ?? {
              pairKey: pair.pairKey,
              playerAId: pair.playerAId,
              playerBId: pair.playerBId,
              value: 0,
              handicapHoles: [],
            };
          }
          return {
            config: { ...state.config, handicaps },
          };
        }),

      submitHoleStrokes: (strokes) =>
        set((state) => {
          if (!state.config) return {};

          const { players, handicaps, turboHoles } = state.config;
          const holeNumber = strokes.holeNumber;
          const isTurbo = turboHoles.includes(holeNumber);

          // Remove any existing data for this hole (allows re-scoring)
          const existingStrokes = state.holeStrokes.filter(
            (s) => s.holeNumber !== holeNumber
          );
          const existingPairResults = state.pairResults.filter(
            (r) => r.holeNumber !== holeNumber
          );
          const existingPlayerScores = state.playerScores.filter(
            (s) => s.holeNumber !== holeNumber
          );

          // Calculate pair results for this hole
          const pairs = generatePairs(players);
          const newPairResults: PairHoleResult[] = pairs.map((pair) => {
            const handicap = handicaps[pair.pairKey] ?? {
              pairKey: pair.pairKey,
              playerAId: pair.playerAId,
              playerBId: pair.playerBId,
              value: 0,
              handicapHoles: [],
            };
            return calculatePairHoleResult(
              pair.pairKey,
              pair.playerAId,
              pair.playerBId,
              holeNumber,
              strokes,
              handicap,
              isTurbo
            );
          });

          // Merge all pair results
          const allPairResults = [...existingPairResults, ...newPairResults];

          // Get previous totals (from all holes before this one)
          const previousTotals = getRunningTotals(existingPlayerScores, holeNumber - 1);

          // Calculate player scores for this hole
          const newPlayerScores = calculatePlayerHoleScores(
            players,
            allPairResults,
            holeNumber,
            previousTotals
          );

          // Recalculate all subsequent holes' running totals
          const allPlayerScores = [...existingPlayerScores, ...newPlayerScores];

          return {
            holeStrokes: [...existingStrokes, strokes],
            pairResults: allPairResults,
            playerScores: allPlayerScores,
          };
        }),

      goToHole: (holeNumber) => set({ currentHole: holeNumber }),

      goToNextHole: () =>
        set((state) => {
          if (!state.config) return {};
          const next = Math.min(
            state.currentHole + 1,
            state.config.numberOfHoles
          );
          return { currentHole: next };
        }),

      goToPreviousHole: () =>
        set((state) => ({
          currentHole: Math.max(state.currentHole - 1, 1),
        })),

      completeGame: () => set({ isComplete: true }),

      resetGame: () => set({ ...initialState }),

      hasActiveGame: () => {
        const state = get();
        return state.config !== null && state.holeStrokes.length > 0;
      },
    }),
    {
      name: "golf-handicap-game",
    }
  )
);
