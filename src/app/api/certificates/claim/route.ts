import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const bodySchema = z.object({ certificateId: z.string().min(1) });

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const certificate = await prisma.certificate.findUnique({
    where: { id: parsed.data.certificateId },
  });
  if (!certificate) {
    return NextResponse.json({ error: "Certificate not found." }, { status: 404 });
  }

  await prisma.userCertificate.upsert({
    where: {
      userId_certificateId: {
        userId: user.id,
        certificateId: certificate.id,
      },
    },
    update: {},
    create: { userId: user.id, certificateId: certificate.id },
  });

  return NextResponse.json({ ok: true, certificateId: certificate.id });
}
