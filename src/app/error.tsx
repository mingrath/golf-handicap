"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6">
      <div className="text-5xl mb-6">&#9888;&#65039;</div>
      <h2 className="text-lg font-bold text-foreground mb-2">
        Something went wrong
      </h2>
      <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs">
        An unexpected error occurred. You can try again or go back to the home
        screen.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="h-12 px-6 rounded-xl text-sm font-bold bg-emerald-600 text-white active:scale-[0.97] transition-all"
        >
          Try Again
        </button>
        <button
          onClick={() => (window.location.href = "/")}
          className="h-12 px-6 rounded-xl text-sm font-bold bg-muted border border-border text-foreground active:scale-[0.97] transition-all"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
