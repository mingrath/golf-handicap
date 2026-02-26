import type { Metadata } from "next";
import HandicapClient from "./handicap-client";

export const metadata: Metadata = {
  title: "Handicap Config",
};

export default function Page() {
  return <HandicapClient />;
}
