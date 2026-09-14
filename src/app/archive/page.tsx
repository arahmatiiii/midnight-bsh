"use client";

import { useEffect, useState } from "react";

type ArchivePost = {
  id: string;
  content: string;
  hashtags: string[];
  likeCount: number;
  dislikeCount: number;
  author: string;
  requiredCertificate: string | null;
};

type ArchiveNight = {
  dateKey: string;
  theme: string | null;
  top: ArchivePost[];
  bottom: ArchivePost[];
};

function PostRow({ post }: { post: ArchivePost }) {
  return (
    <li className="rounded-lg border border-border bg-background p-3 text-sm">
      <p className="mb-1 whitespace-pre-wrap break-words">{post.content}</p>
      <p className="text-xs text-muted">
        {post.author} · 👍 {post.likeCount} 👎 {post.dislikeCount}
        {post.requiredCertificate && ` · needed ${post.requiredCertificate}`}
      </p>
    </li>
  );
}

export default function ArchivePage() {
  const [nights, setNights] = useState<ArchiveNight[] | null>(null);

  useEffect(() => {
    fetch("/api/archive")
      .then((r) => r.json())
      .then((data) => setNights(data.nights ?? []));
  }, []);

  if (!nights) return <p className="text-sm text-muted">Loading…</p>;

  if (nights.length === 0) {
    return (
      <p className="text-sm text-muted">
        No past nights yet. Check back after the first one rolls over.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-bold">Archive</h1>
      {nights.map((night) => (
        <section key={night.dateKey}>
          <h2 className="mb-3 text-sm font-semibold text-muted">
            {night.dateKey}
            {night.theme && ` — ${night.theme}`}
          </h2>
          {night.top.length > 0 && (
            <>
              <p className="mb-1 text-xs uppercase text-accent">Top Bullshit</p>
              <ul className="mb-4 flex flex-col gap-2">
                {night.top.map((p) => (
                  <PostRow key={p.id} post={p} />
                ))}
              </ul>
            </>
          )}
          {night.bottom.length > 0 && (
            <>
              <p className="mb-1 text-xs uppercase text-danger">
                Bottom of the Barrel
              </p>
              <ul className="flex flex-col gap-2">
                {night.bottom.map((p) => (
                  <PostRow key={p.id} post={p} />
                ))}
              </ul>
            </>
          )}
        </section>
      ))}
    </div>
  );
}
