import type { Metadata } from "next";
import StatsClient from "./stats-client";

export const metadata: Metadata = {
  title: "Player Stats",
};

export default function Page() {
  return <StatsClient />;
}
