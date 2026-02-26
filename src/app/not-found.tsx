import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6">
      <div className="text-8xl mb-6">&#9971;</div>
      <h2 className="text-2xl font-bold text-foreground mb-2">
        Page Not Found
      </h2>
      <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="h-12 px-6 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/25 active:scale-[0.97] transition-all inline-flex items-center"
      >
        Back to Home
      </Link>
    </div>
  );
}
