import { prisma } from "@/lib/prisma";
import { getNightWindowStatus } from "@/lib/night";

/**
 * Returns the Night row for the currently-open window, creating it on first
 * write of the night. Returns null if the window is currently closed —
 * callers must check `getNightWindowStatus().isOpen` before calling this.
 */
export async function getOrCreateCurrentNight() {
  const status = getNightWindowStatus();
  if (!status.isOpen) return null;
  return prisma.night.upsert({
    where: { dateKey: status.dateKey },
    update: {},
    create: { dateKey: status.dateKey },
  });
}

/** The latest night that hasn't been archived by the rollover job yet. */
export async function getLatestOpenOrPendingNight() {
  return prisma.night.findFirst({
    where: { rolledOverAt: null },
    orderBy: { startedAt: "desc" },
  });
}
