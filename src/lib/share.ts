import { toPng } from "html-to-image";
import { toast } from "sonner";

export async function captureAndShare(
  element: HTMLElement,
  filename: string = "golf-results.png"
): Promise<void> {
  try {
    // Capture DOM node as PNG data URL
    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#0f172a", // slate-950
    });

    // Convert to File
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], filename, { type: "image/png" });

    // Try Web Share API
    if (
      typeof navigator !== "undefined" &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      try {
        await navigator.share({ files: [file], title: "Golf Results" });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return; // User cancelled
        // Fall through to download
      }
    }

    // Fallback: download
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    link.click();
    toast.success("Results saved!");
  } catch (err) {
    console.error("Share failed:", err);
    toast.error("Failed to capture results image");
  }
}

export function canNativeShare(): boolean {
  if (typeof navigator === "undefined") return false;
  if (!navigator.canShare) return false;
  try {
    const testFile = new File(["test"], "test.png", { type: "image/png" });
    return navigator.canShare({ files: [testFile] });
  } catch {
    return false;
  }
}
