import { NextResponse } from "next/server";
import { generateNonce } from "siwe";
import { prisma } from "@/lib/prisma";

const NONCE_TTL_MS = 5 * 60 * 1000;

export async function GET() {
  const nonce = generateNonce();
  await prisma.authNonce.create({
    data: {
      nonce,
      expiresAt: new Date(Date.now() + NONCE_TTL_MS),
    },
  });
  return NextResponse.json({ nonce });
}
