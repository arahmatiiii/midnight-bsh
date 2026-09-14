import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const usernameSchema = z
  .string()
  .trim()
  .min(2, "Username must be at least 2 characters.")
  .max(24, "Username must be at most 24 characters.")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username can only contain letters, numbers and underscores."
  );

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = usernameSchema.safeParse(body?.username);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid username." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({
    where: { username: parsed.data },
  });
  if (existing && existing.id !== user.id) {
    return NextResponse.json(
      { error: "That username is already taken." },
      { status: 409 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { username: parsed.data },
  });

  return NextResponse.json({
    username: updated.username,
    walletAddress: updated.walletAddress,
  });
}
