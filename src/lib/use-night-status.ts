"use client";

import { useEffect, useState } from "react";

export type NightStatus = {
  isOpen: boolean;
  dateKey: string;
  opensAt: string;
  closesAt: string;
};

export function useNightStatus() {
  const [status, setStatus] = useState<NightStatus | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/night/status");
      if (!res.ok || cancelled) return;
      const data = (await res.json()) as NightStatus;
      setStatus(data);
    }
    load();
    const refetchId = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(refetchId);
    };
  }, []);

  useEffect(() => {
    const tickId = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tickId);
  }, []);

  if (!status) return { status: null, now, msRemaining: null };

  const boundary = status.isOpen ? status.closesAt : status.opensAt;
  const msRemaining = Math.max(0, new Date(boundary).getTime() - now);

  return { status, now, msRemaining };
}

export function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
