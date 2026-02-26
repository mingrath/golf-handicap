import type { Metadata } from "next";
import PlayClient from "./play-client";

export const metadata: Metadata = {
  title: "Play",
};

export default function Page() {
  return <PlayClient />;
}
