"use client";

import type { PostDTO } from "@/lib/types";

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function PostCard({
  post,
  onVote,
  votingDisabled,
}: {
  post: PostDTO;
  onVote: (postId: string, value: "LIKE" | "DISLIKE") => void;
  votingDisabled: boolean;
}) {
  const canVote = !post.isLocked && !votingDisabled;

  return (
    <article className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span>
          {post.author.displayName}
          {post.isOwn && <span className="ml-1 text-accent">(you)</span>}
        </span>
        <span>{timeAgo(post.createdAt)}</span>
      </div>

      {post.requiredCertificate && (
        <div className="mb-2 inline-flex items-center gap-1 rounded-full border border-border bg-surface-hover px-2 py-0.5 text-xs text-muted">
          {post.requiredCertificate.icon} Requires: {post.requiredCertificate.name}
        </div>
      )}

      {post.isLocked ? (
        <p className="mb-3 rounded-lg border border-dashed border-border p-3 text-sm text-muted">
          🔒 Locked. Claim the{" "}
          <a href="/profile" className="text-accent hover:underline">
            {post.requiredCertificate?.name}
          </a>{" "}
          certificate to view and vote on this post.
        </p>
      ) : (
        <p className="mb-3 whitespace-pre-wrap break-words text-[15px]">
          {post.content}
        </p>
      )}

      {post.hashtags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {post.hashtags.map((tag) => (
            <span key={tag} className="text-xs text-accent">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 text-sm">
        <button
          disabled={!canVote}
          onClick={() => onVote(post.id, "LIKE")}
          className={`flex items-center gap-1 rounded-full border px-2.5 py-1 disabled:opacity-40 ${
            post.myVote === "LIKE"
              ? "border-accent bg-accent-strong/20 text-accent"
              : "border-border hover:border-accent"
          }`}
        >
          👍 {post.likeCount}
        </button>
        <button
          disabled={!canVote}
          onClick={() => onVote(post.id, "DISLIKE")}
          className={`flex items-center gap-1 rounded-full border px-2.5 py-1 disabled:opacity-40 ${
            post.myVote === "DISLIKE"
              ? "border-danger bg-danger/20 text-danger"
              : "border-border hover:border-danger"
          }`}
        >
          👎 {post.dislikeCount}
        </button>
      </div>
    </article>
  );
}
