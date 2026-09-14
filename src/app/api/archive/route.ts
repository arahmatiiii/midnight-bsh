import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/posts";

export const dynamic = "force-dynamic";

export async function GET() {
  const summaries = await prisma.nightSummary.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      night: true,
      entries: {
        orderBy: [{ role: "asc" }, { rank: "asc" }],
        include: { post: { include: { author: true, requiredCertificate: true } } },
      },
    },
  });

  return NextResponse.json({
    nights: summaries.map((summary) => ({
      dateKey: summary.night.dateKey,
      theme: summary.night.theme,
      top: summary.entries
        .filter((e) => e.role === "TOP")
        .map((e) => ({
          id: e.post.id,
          content: e.post.content,
          hashtags: e.post.hashtags,
          likeCount: e.post.likeCount,
          dislikeCount: e.post.dislikeCount,
          author: displayName(e.post.author),
          requiredCertificate: e.post.requiredCertificate?.name ?? null,
        })),
      bottom: summary.entries
        .filter((e) => e.role === "BOTTOM")
        .map((e) => ({
          id: e.post.id,
          content: e.post.content,
          hashtags: e.post.hashtags,
          likeCount: e.post.likeCount,
          dislikeCount: e.post.dislikeCount,
          author: displayName(e.post.author),
          requiredCertificate: e.post.requiredCertificate?.name ?? null,
        })),
    })),
  });
}
