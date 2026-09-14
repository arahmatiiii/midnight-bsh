"use client";

import Link from "next/link";
import { useWallet } from "@/lib/wallet-context";

export function SiteHeader() {
  const { user, isLoading, isConnecting, error, connect, disconnect } = useWallet();

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          🌙 Midnight <span className="text-accent">BSH</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted">
          <Link href="/" className="hover:text-foreground">
            Feed
          </Link>
          <Link href="/archive" className="hover:text-foreground">
            Archive
          </Link>
          {user && (
            <Link href="/profile" className="hover:text-foreground">
              Profile
            </Link>
          )}
          {isLoading ? null : user ? (
            <button
              onClick={disconnect}
              className="rounded-full bg-surface-hover border border-border px-3 py-1.5 text-foreground hover:border-accent"
              title={user.walletAddress}
            >
              {user.username ?? `${user.walletAddress.slice(0, 6)}…${user.walletAddress.slice(-4)}`}
            </button>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="rounded-full bg-accent-strong px-3 py-1.5 font-medium text-white hover:bg-accent disabled:opacity-60"
            >
              {isConnecting ? "Connecting…" : "Connect Wallet"}
            </button>
          )}
        </nav>
      </div>
      {error && (
        <div className="mx-auto max-w-2xl px-4 pb-2 text-xs text-danger">{error}</div>
      )}
    </header>
  );
}
