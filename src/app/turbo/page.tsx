import type { Metadata } from "next";
import TurboClient from "./turbo-client";

export const metadata: Metadata = {
  title: "Turbo Holes",
};

export default function Page() {
  return <TurboClient />;
}
