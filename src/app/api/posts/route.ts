import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getNightWindowStatus } from "@/lib/night";
import { getLatestOpenOrPendingNight, getOrCreateCurrentNight } from "@/lib/nights";
import { serializePost } from "@/lib/posts";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  content: z.string().trim().min(1, "Say something.").max(500),
  hashtags: z
    .array(
      z
        .string()
        .trim()
        .regex(/^[a-zA-Z0-9_]+$/, "Hashtags can only contain letters, numbers and underscores.")
        .max(24)
    )
    .max(3, "Up to 3 hashtags."),
  requiredCertificateId: z.string().min(1).optional().nullable(),
});

export async function GET() {
  const user = await getCurrentUser();
  const night = await getLatestOpenOrPendingNight();
  if (!night) {
    return NextResponse.json({ night: null, posts: [] });
  }

  const heldCertificateIds = user
    ? new Set(
        (
          await prisma.userCertificate.findMany({
            where: { userId: user.id },
            select: { certificateId: true },
          })
        ).map((c) => c.certificateId)
      )
    : new Set<string>();

  const posts = await prisma.post.findMany({
    where: { nightId: night.id, isArchived: false },
    orderBy: { createdAt: "desc" },
    include: { author: true, requiredCertificate: true, votes: true },
  });

  return NextResponse.json({
    night: { id: night.id, dateKey: night.dateKey, theme: night.theme },
    posts: posts.map((p) => serializePost(p, user?.id ?? null, heldCertificateIds)),
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const status = getNightWindowStatus();
  if (!status.isOpen) {
    return NextResponse.json(
      {
        error: "Midnight BSH is closed right now. Come back tonight.",
        opensAt: status.opensAt.toISOString(),
      },
      { status: 403 }
    );
  }

  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid post." },
      { status: 400 }
    );
  }

  if (parsed.data.requiredCertificateId) {
    const cert = await prisma.certificate.findUnique({
      where: { id: parsed.data.requiredCertificateId },
    });
    if (!cert) {
      return NextResponse.json({ error: "Unknown certificate." }, { status: 400 });
    }
  }

  const night = await getOrCreateCurrentNight();
  if (!night) {
    return NextResponse.json(
      { error: "Midnight BSH is closed right now. Come back tonight." },
      { status: 403 }
    );
  }

  const post = await prisma.post.create({
    data: {
      nightId: night.id,
      authorId: user.id,
      content: parsed.data.content,
      hashtags: parsed.data.hashtags,
      requiredCertificateId: parsed.data.requiredCertificateId ?? null,
    },
    include: { author: true, requiredCertificate: true, votes: true },
  });

  const heldCertificateIds = new Set(
    (
      await prisma.userCertificate.findMany({
        where: { userId: user.id },
        select: { certificateId: true },
      })
    ).map((c) => c.certificateId)
  );

  return NextResponse.json(
    { post: serializePost(post, user.id, heldCertificateIds) },
    { status: 201 }
  );
}
