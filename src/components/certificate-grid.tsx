"use client";

import { useEffect, useState } from "react";
import type { CertificateDTO } from "@/lib/types";

const rarityColor: Record<CertificateDTO["rarity"], string> = {
  COMMON: "text-muted",
  UNCOMMON: "text-accent",
  RARE: "text-yellow-400",
};

export function CertificateGrid() {
  const [certificates, setCertificates] = useState<CertificateDTO[] | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/certificates");
    const data = await res.json();
    setCertificates(data.certificates ?? []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  async function claim(id: string) {
    setClaimingId(id);
    try {
      await fetch("/api/certificates/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificateId: id }),
      });
      await load();
    } finally {
      setClaimingId(null);
    }
  }

  if (!certificates) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {certificates.map((cert) => (
        <div
          key={cert.id}
          className="rounded-xl border border-border bg-surface p-4"
        >
          <div className="mb-1 flex items-center justify-between">
            <span className="text-lg">
              {cert.icon} {cert.name}
            </span>
            <span className={`text-xs uppercase ${rarityColor[cert.rarity]}`}>
              {cert.rarity}
            </span>
          </div>
          <p className="mb-3 text-xs text-muted">{cert.funnyDescription}</p>
          {cert.isHeld ? (
            <span className="inline-block rounded-full bg-accent-strong/20 px-3 py-1 text-xs text-accent">
              ✓ Claimed
            </span>
          ) : (
            <button
              onClick={() => claim(cert.id)}
              disabled={claimingId === cert.id}
              className="rounded-full border border-border px-3 py-1 text-xs hover:border-accent disabled:opacity-50"
            >
              {claimingId === cert.id ? "Claiming…" : "Claim it"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
