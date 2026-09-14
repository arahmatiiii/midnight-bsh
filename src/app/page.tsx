"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@/lib/wallet-context";
import { useNightStatus } from "@/lib/use-night-status";
import { PostComposer } from "@/components/post-composer";
import { PostCard } from "@/components/post-card";
import type { PostDTO } from "@/lib/types";

export default function FeedPage() {
  const { user, connect } = useWallet();
  const { status } = useNightStatus();
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [voteError, setVoteError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    const res = await fetch("/api/posts");
    const data = await res.json();
    setPosts(data.posts ?? []);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadPosts().finally(() => setIsLoading(false));
  }, [loadPosts]);

  async function handleVote(postId: string, value: "LIKE" | "DISLIKE") {
    setVoteError(null);
    const res = await fetch(`/api/posts/${postId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    const data = await res.json();
    if (!res.ok) {
      setVoteError(data.error ?? "Could not vote.");
      return;
    }
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likeCount: data.likeCount, dislikeCount: data.dislikeCount, myVote: data.myVote }
          : p
      )
    );
  }

  const composerDisabledReason = !user
    ? "Connect your wallet to post."
    : status && !status.isOpen
    ? "Midnight BSH is closed right now — come back tonight to post."
    : "";

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Tonight&apos;s Feed</h1>

      {!user ? (
        <div className="mb-6 rounded-xl border border-dashed border-border bg-surface p-4 text-center text-sm text-muted">
          <button onClick={connect} className="text-accent hover:underline">
            Connect your wallet
          </button>{" "}
          to post and vote.
        </div>
      ) : (
        <PostComposer
          disabled={!!composerDisabledReason}
          disabledReason={composerDisabledReason}
          onPosted={loadPosts}
        />
      )}

      {voteError && <p className="mb-3 text-xs text-danger">{voteError}</p>}

      {isLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-muted">
          No posts yet tonight. Be the first bit of bullshit.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onVote={handleVote}
              votingDisabled={!user || !status?.isOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
}
