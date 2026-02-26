import type { Metadata } from "next";
import HistoryClient from "./history-client";

export const metadata: Metadata = {
  title: "Game History",
};

export default function Page() {
  return <HistoryClient />;
}
