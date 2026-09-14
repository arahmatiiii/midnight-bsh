"use client";

import { useNightStatus, formatDuration } from "@/lib/use-night-status";

export function NightBanner() {
  const { status, msRemaining } = useNightStatus();

  if (!status || msRemaining === null) {
    return (
      <div className="w-full bg-surface border-b border-border px-4 py-2 text-sm text-muted text-center">
        Checking the hour…
      </div>
    );
  }

  if (status.isOpen) {
    return (
      <div className="w-full bg-accent-strong/20 border-b border-accent/40 px-4 py-2 text-sm text-center">
        🌙 Midnight BSH is open — closes in{" "}
        <span className="font-mono font-semibold">{formatDuration(msRemaining)}</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-surface border-b border-border px-4 py-2 text-sm text-muted text-center">
      😴 Closed for the day — reopens in{" "}
      <span className="font-mono font-semibold text-foreground">
        {formatDuration(msRemaining)}
      </span>
      {" · "}browse the{" "}
      <a href="/archive" className="text-accent hover:underline">
        archive
      </a>{" "}
      in the meantime.
    </div>
  );
}
