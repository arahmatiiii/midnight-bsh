import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNightWindowStatus } from "@/lib/night";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const query = request.nextUrl.searchParams.get("secret");
  return query === secret;
}

function score(post: { likeCount: number; dislikeCount: number }) {
  return post.likeCount - post.dislikeCount;
}

async function rolloverNight(nightId: string) {
  const posts = await prisma.post.findMany({
    where: { nightId, isArchived: false },
  });
  if (posts.length === 0) {
    await prisma.night.update({
      where: { id: nightId },
      data: { rolledOverAt: new Date() },
    });
    return { nightId, top: 0, bottom: 0 };
  }

  const sortedDesc = [...posts].sort((a, b) => score(b) - score(a));
  const top = sortedDesc.slice(0, 3);
  const topIds = new Set(top.map((p) => p.id));
  const bottom = posts
    .filter((p) => !topIds.has(p.id))
    .sort((a, b) => score(a) - score(b))
    .slice(0, 3);

  await prisma.$transaction([
    prisma.nightSummary.create({
      data: {
        nightId,
        entries: {
          create: [
            ...top.map((p, i) => ({ postId: p.id, role: "TOP" as const, rank: i })),
            ...bottom.map((p, i) => ({ postId: p.id, role: "BOTTOM" as const, rank: i })),
          ],
        },
      },
    }),
    prisma.post.updateMany({
      where: { nightId },
      data: { isArchived: true },
    }),
    prisma.night.update({
      where: { id: nightId },
      data: { rolledOverAt: new Date() },
    }),
  ]);

  return { nightId, top: top.length, bottom: bottom.length };
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const status = getNightWindowStatus();
  const closedNights = await prisma.night.findMany({
    where: {
      rolledOverAt: null,
      ...(status.isOpen ? { dateKey: { not: status.dateKey } } : {}),
    },
  });

  const results = [];
  for (const night of closedNights) {
    results.push(await rolloverNight(night.id));
  }

  return NextResponse.json({ rolledOver: results });
}

// Vercel Cron sends GET requests by default.
export const GET = POST;
