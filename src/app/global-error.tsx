"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: "#0f172a",
            color: "#f8fafc",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>&#9888;&#65039;</div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>
            Something went wrong
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "#94a3b8",
              marginBottom: "24px",
              textAlign: "center",
            }}
          >
            A critical error occurred. Please try again.
          </p>
          <button
            onClick={() => reset()}
            style={{
              height: "48px",
              padding: "0 24px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 700,
              background: "#059669",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
