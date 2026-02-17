"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface GameHeaderProps {
  title: string;
  backHref?: string;
  rightAction?: React.ReactNode;
}

export function GameHeader({ title, backHref, rightAction }: GameHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border px-4 py-4 flex items-center gap-3">
      {backHref && (
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground hover:bg-muted/50 h-10 w-10 shrink-0 transition-colors"
          onClick={() => router.push(backHref)}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      )}
      <h1 className="text-lg font-bold flex-1 truncate text-foreground">{title}</h1>
      {rightAction}
    </header>
  );
}
