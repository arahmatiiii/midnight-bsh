import type { Certificate, Post, User, Vote, VoteValue } from "@prisma/client";

export function displayName(author: Pick<User, "username" | "walletAddress">) {
  if (author.username) return author.username;
  return `${author.walletAddress.slice(0, 6)}…${author.walletAddress.slice(-4)}`;
}

type PostWithRelations = Post & {
  author: User;
  requiredCertificate: Certificate | null;
  votes: Vote[];
};

export function serializePost(
  post: PostWithRelations,
  viewerId: string | null,
  heldCertificateIds: Set<string>
) {
  const isLocked = Boolean(
    post.requiredCertificateId &&
      (!viewerId || !heldCertificateIds.has(post.requiredCertificateId))
  );

  const myVote = viewerId
    ? post.votes.find((v) => v.userId === viewerId)?.value ?? null
    : null;

  return {
    id: post.id,
    content: isLocked ? null : post.content,
    hashtags: post.hashtags,
    likeCount: post.likeCount,
    dislikeCount: post.dislikeCount,
    createdAt: post.createdAt.toISOString(),
    isOwn: viewerId === post.authorId,
    isLocked,
    author: {
      username: post.author.username,
      walletAddress: post.author.walletAddress,
      displayName: displayName(post.author),
    },
    requiredCertificate: post.requiredCertificate
      ? {
          id: post.requiredCertificate.id,
          name: post.requiredCertificate.name,
          icon: post.requiredCertificate.icon,
        }
      : null,
    myVote: myVote as VoteValue | null,
  };
}
