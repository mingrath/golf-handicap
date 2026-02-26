import type { Metadata } from "next";
import SetupClient from "./setup-client";

export const metadata: Metadata = {
  title: "Setup Game",
};

export default function Page() {
  return <SetupClient />;
}
