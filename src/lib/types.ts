export type PostDTO = {
  id: string;
  content: string | null;
  hashtags: string[];
  likeCount: number;
  dislikeCount: number;
  createdAt: string;
  isOwn: boolean;
  isLocked: boolean;
  author: { username: string | null; walletAddress: string; displayName: string };
  requiredCertificate: { id: string; name: string; icon: string } | null;
  myVote: "LIKE" | "DISLIKE" | null;
};

export type CertificateDTO = {
  id: string;
  slug: string;
  name: string;
  description: string;
  funnyDescription: string;
  icon: string;
  rarity: "COMMON" | "UNCOMMON" | "RARE";
  isHeld: boolean;
};
