import type { Metadata } from "next";
import ResultsClient from "./results-client";

export const metadata: Metadata = {
  title: "Results",
};

export default function Page() {
  return <ResultsClient />;
}
