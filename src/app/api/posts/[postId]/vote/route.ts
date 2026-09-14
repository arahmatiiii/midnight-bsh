import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getNightWindowStatus } from "@/lib/night";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ value: z.enum(["LIKE", "DISLIKE"]) });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const status = getNightWindowStatus();
  if (!status.isOpen) {
    return NextResponse.json(
      { error: "Voting is only open during the night window." },
      { status: 403 }
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid vote value." }, { status: 400 });
  }

  const { postId } = await params;
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post || post.isArchived) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  if (post.requiredCertificateId) {
    const holds = await prisma.userCertificate.findUnique({
      where: {
        userId_certificateId: {
          userId: user.id,
          certificateId: post.requiredCertificateId,
        },
      },
    });
    if (!holds) {
      return NextResponse.json(
        { error: "You need the required certificate to vote on this post." },
        { status: 403 }
      );
    }
  }

  const existing = await prisma.vote.findUnique({
    where: { postId_userId: { postId: post.id, userId: user.id } },
  });

  const countField = (value: "LIKE" | "DISLIKE") =>
    value === "LIKE" ? "likeCount" : "dislikeCount";

  let myVote: "LIKE" | "DISLIKE" | null;

  if (!existing) {
    await prisma.$transaction([
      prisma.vote.create({
        data: { postId: post.id, userId: user.id, value: parsed.data.value },
      }),
      prisma.post.update({
        where: { id: post.id },
        data: { [countField(parsed.data.value)]: { increment: 1 } },
      }),
    ]);
    myVote = parsed.data.value;
  } else if (existing.value === parsed.data.value) {
    await prisma.$transaction([
      prisma.vote.delete({ where: { id: existing.id } }),
      prisma.post.update({
        where: { id: post.id },
        data: { [countField(existing.value)]: { decrement: 1 } },
      }),
    ]);
    myVote = null;
  } else {
    await prisma.$transaction([
      prisma.vote.update({
        where: { id: existing.id },
        data: { value: parsed.data.value },
      }),
      prisma.post.update({
        where: { id: post.id },
        data: {
          [countField(existing.value)]: { decrement: 1 },
          [countField(parsed.data.value)]: { increment: 1 },
        },
      }),
    ]);
    myVote = parsed.data.value;
  }

  const updated = await prisma.post.findUniqueOrThrow({ where: { id: post.id } });

  return NextResponse.json({
    myVote,
    likeCount: updated.likeCount,
    dislikeCount: updated.dislikeCount,
  });
}
