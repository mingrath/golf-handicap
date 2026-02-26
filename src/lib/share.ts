import { toast } from "sonner";

export interface ShareRanking {
  playerName: string;
  totalScore: number;
  rank: number;
}

function formatScore(score: number): string {
  return score > 0 ? `+${score}` : String(score);
}

/**
 * Generate the share image using Canvas 2D API.
 * This is far more reliable than html-to-image on mobile devices
 * (which fails to render off-screen DOM elements on Android).
 */
function generateShareImageBlob(
  rankings: ShareRanking[],
  numberOfHoles: number
): Promise<Blob> {
  const scale = 2; // retina
  const w = 375;
  const padX = 24;
  const padY = 32;
  const rowH = 44;

  const headerH = 80;
  const winnerH = rankings.length > 0 ? 140 : 0;
  const listH = rankings.length * rowH + 8;
  const footerH = 48;
  const h = padY + headerH + winnerH + listH + footerH + padY;

  const canvas = document.createElement("canvas");
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  const sansFont = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  // -- Background --
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, w, h);

  let y = padY;

  // -- Header --
  ctx.textAlign = "center";
  ctx.fillStyle = "#f8fafc";
  ctx.font = `bold 18px ${sansFont}`;
  ctx.fillText("Golf Handicap Scorer", w / 2, y + 28);

  ctx.fillStyle = "#94a3b8";
  ctx.font = `normal 13px ${sansFont}`;
  ctx.fillText(`${numberOfHoles} holes`, w / 2, y + 52);

  y += headerH;

  // -- Winner spotlight --
  if (rankings.length > 0) {
    const winner = rankings[0];

    ctx.fillStyle = "#fbbf24"; // amber-400
    ctx.font = `bold 14px ${sansFont}`;
    ctx.fillText("\u2605 WINNER \u2605", w / 2, y + 20);

    ctx.fillStyle = "#f8fafc";
    ctx.font = `bold 24px ${sansFont}`;
    ctx.fillText(winner.playerName, w / 2, y + 56);

    const sc = winner.totalScore;
    ctx.fillStyle = sc > 0 ? "#34d399" : sc < 0 ? "#fb7185" : "#94a3b8";
    ctx.font = `bold 20px ${sansFont}`;
    ctx.fillText(`${formatScore(sc)} points`, w / 2, y + 88);

    y += winnerH;
  }

  // -- Rankings list --
  for (const entry of rankings) {
    // Separator line
    ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(padX, y);
    ctx.lineTo(w - padX, y);
    ctx.stroke();

    const cy = y + rowH / 2 + 5;

    // Rank
    ctx.textAlign = "left";
    ctx.fillStyle = "#94a3b8";
    ctx.font = `bold 16px ${sansFont}`;
    ctx.fillText(String(entry.rank), padX + 12, cy);

    // Name
    ctx.fillStyle = "#f8fafc";
    ctx.font = `normal 15px ${sansFont}`;
    ctx.fillText(entry.playerName, padX + 48, cy);

    // Score
    ctx.textAlign = "right";
    const sc = entry.totalScore;
    ctx.fillStyle = sc > 0 ? "#34d399" : sc < 0 ? "#fb7185" : "#94a3b8";
    ctx.font = `bold 15px ${sansFont}`;
    ctx.fillText(formatScore(sc), w - padX - 12, cy);

    y += rowH;
  }

  // Last separator
  ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
  ctx.beginPath();
  ctx.moveTo(padX, y);
  ctx.lineTo(w - padX, y);
  ctx.stroke();

  // -- Footer --
  ctx.textAlign = "center";
  ctx.fillStyle = "#64748b";
  ctx.font = `normal 11px ${sansFont}`;
  ctx.fillText("golfscorer.app", w / 2, y + 32);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Failed to generate image")),
      "image/png"
    );
  });
}

export async function captureAndShare(
  rankings: ShareRanking[],
  numberOfHoles: number,
  filename = "golf-results.png"
): Promise<void> {
  try {
    const blob = await generateShareImageBlob(rankings, numberOfHoles);
    const file = new File([blob], filename, { type: "image/png" });

    // Try Web Share API (native share sheet on mobile)
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
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = filename;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Results saved!");
  } catch (err) {
    console.error("Share failed:", err);
    toast.error("Failed to generate results image");
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
