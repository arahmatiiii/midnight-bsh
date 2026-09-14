# 🌙 Midnight BSH

A social app for posting bullshit — literally. You connect a crypto wallet
instead of making an account, post short "BSH" (jokes/rants/hot takes), and
the community likes or dislikes them. Two twists:

1. **It's only open 9pm–9am** (configurable). Outside that window the feed
   is read-only; every morning the best and worst posts of the night are
   archived and the slate is wiped for tonight.
2. **Certificates.** Silly, entirely self-declared badges ("College
   Graduate", "Over 21", "Seen True Detective") that anyone can claim with
   one click, and that a post's author can require of anyone who wants to
   like/dislike or even see that post's content.

## Why this exists

This is a from-scratch reimplementation of a product idea the original
author had prototyped five separate times across five different repos
("MidEarn"/Web3Social, jokeshare, bsh_social, bsh-frot, midnight_bullshit) —
each one a different tech stack, none of them finished or fully wired
together. This repo merges the strongest idea from each attempt into one
working app:

- The wallet-based identity + certificate-gated posts idea (jokeshare,
  bsh_social, bsh-frot).
- The night-only, "wiped clean every morning" mechanic with an archive of
  highlights (midnight_bullshit).

## Stack

- **Next.js 16** (App Router, Turbopack, React 19, TypeScript)
- **PostgreSQL** via **Prisma** — the database is the app's source of truth
- **SIWE** (Sign-In With Ethereum) for wallet-based auth, sessions via
  **iron-session**
- **Tailwind CSS v4**
- An **optional** Solidity contract under `contracts/` for anyone who wants
  a fully on-chain variant — the running app does not depend on it

## How the pieces fit together

- `src/lib/night.ts` — pure time-window logic (open/closed, current night's
  `dateKey`, next open/close instant), computed from `NIGHT_START_HOUR`,
  `NIGHT_END_HOUR` and `TIMEZONE`, with no date library — just `Intl` plus a
  small self-correcting local-time↔UTC conversion (handles DST correctly,
  see the two-pass trick in `localPartsToUtc`).
- `src/lib/wallet-context.tsx` — client-side wallet connect + SIWE
  sign-in flow against a raw injected `window.ethereum` provider (MetaMask
  or similar). No wagmi/viem provider setup needed for this.
- API routes under `src/app/api/**` are the actual security boundary:
  every mutation (`POST /api/posts`, `POST /api/posts/:id/vote`,
  `POST /api/certificates/claim`) re-checks auth and, where relevant, the
  night window and certificate ownership server-side. The UI reflects that
  state but never enforces it.
- `POST /api/cron/nightly-rollover` — idempotent job: finds any night that
  isn't the currently-open one and hasn't been rolled over yet, computes
  its top/bottom 3 posts by (likes − dislikes), records a `NightSummary`,
  and archives (not deletes) that night's posts. Safe to call as often as
  you want; wired to run daily via `vercel.json`.

## Local development

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL and SESSION_SECRET
npx prisma migrate dev
npm run db:seed         # seeds the certificate list
npm run dev
```

Open http://localhost:3000. You'll need a browser wallet extension
(MetaMask etc.) to connect and post — reading the feed and archive works
without one.

## Design decisions worth knowing about

- **Certificates are unrestricted self-claims**, on purpose — this is a
  joke feature, not an identity verification system. Don't build anything
  security-sensitive on top of "holds a certificate".
- **Voting and posting are night-gated; claiming certificates is not** —
  certificates are treated as profile/identity setup, not "content for
  tonight".
- **Archived posts are not deleted**, unlike one of the original prototypes
  that wiped everything each morning — they're just marked `isArchived` and
  surfaced through `/archive` instead of the live feed. Nothing is lost.
- **No wagmi/viem client SDK** — wallet connect is done directly against
  `window.ethereum` (EIP-1193) and the `siwe` package, which keeps the
  client bundle smaller and avoids a whole provider-config layer for what
  is, at the end of the day, one wallet connect button.

## Optional: the on-chain variant

See `contracts/README.md`. It's a separate, self-contained Hardhat project
implementing the same post/vote/certificate model as a Solidity contract,
with a full test suite. The web app works completely without it.
