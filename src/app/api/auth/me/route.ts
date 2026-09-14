import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null });
  }
  const certificateCount = await prisma.userCertificate.count({
    where: { userId: user.id },
  });
  return NextResponse.json({
    user: {
      id: user.id,
      walletAddress: user.walletAddress,
      username: user.username,
      certificateCount,
    },
  });
}
