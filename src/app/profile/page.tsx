"use client";

import { useState } from "react";
import { useWallet } from "@/lib/wallet-context";
import { CertificateGrid } from "@/components/certificate-grid";

export default function ProfilePage() {
  const { user, isLoading, refresh } = useWallet();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save.");
      await refresh();
      setUsername("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <p className="text-sm text-muted">Loading…</p>;

  if (!user) {
    return (
      <p className="text-sm text-muted">Connect your wallet to see your profile.</p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-border bg-surface p-4">
        <p className="mb-1 text-xs text-muted">Wallet</p>
        <p className="mb-4 font-mono text-sm">{user.walletAddress}</p>
        <p className="mb-1 text-xs text-muted">Username</p>
        <p className="mb-4 text-lg font-semibold">
          {user.username ?? "— not set —"}
        </p>
        <form onSubmit={handleSave} className="flex gap-2">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="pick a username"
            maxLength={24}
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={isSaving || username.trim().length === 0}
            className="rounded-lg bg-accent-strong px-4 py-1.5 text-sm font-medium text-white hover:bg-accent disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
        </form>
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Certificates</h2>
        <CertificateGrid />
      </section>
    </div>
  );
}
