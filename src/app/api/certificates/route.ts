import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  const certificates = await prisma.certificate.findMany({
    orderBy: { name: "asc" },
  });

  const heldIds = user
    ? new Set(
        (
          await prisma.userCertificate.findMany({
            where: { userId: user.id },
            select: { certificateId: true },
          })
        ).map((c) => c.certificateId)
      )
    : new Set<string>();

  return NextResponse.json({
    certificates: certificates.map((c) => ({
      ...c,
      isHeld: heldIds.has(c.id),
    })),
  });
}
