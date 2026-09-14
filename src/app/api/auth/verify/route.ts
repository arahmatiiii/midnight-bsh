import { NextRequest, NextResponse } from "next/server";
import { SiweMessage } from "siwe";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  let body: { message?: string; signature?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { message, signature } = body;
  if (!message || !signature) {
    return NextResponse.json(
      { error: "message and signature are required." },
      { status: 400 }
    );
  }

  let siweMessage: SiweMessage;
  try {
    siweMessage = new SiweMessage(message);
  } catch {
    return NextResponse.json(
      { error: "Malformed SIWE message." },
      { status: 400 }
    );
  }

  const expectedDomain = request.headers.get("host") ?? undefined;

  let verification;
  try {
    verification = await siweMessage.verify({
      signature,
      domain: expectedDomain,
      nonce: siweMessage.nonce,
    });
  } catch {
    return NextResponse.json(
      { error: "Signature verification failed." },
      { status: 401 }
    );
  }

  if (!verification.success) {
    return NextResponse.json(
      { error: verification.error?.type ?? "Signature verification failed." },
      { status: 401 }
    );
  }

  // The nonce must be one we actually issued, unexpired, and single-use.
  const storedNonce = await prisma.authNonce.findUnique({
    where: { nonce: siweMessage.nonce },
  });
  if (!storedNonce || storedNonce.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Nonce is invalid or expired. Please try connecting again." },
      { status: 401 }
    );
  }
  await prisma.authNonce.delete({ where: { nonce: siweMessage.nonce } });

  const walletAddress = siweMessage.address.toLowerCase();
  const user = await prisma.user.upsert({
    where: { walletAddress },
    update: {},
    create: { walletAddress },
  });

  const session = await getSession();
  session.userId = user.id;
  session.walletAddress = user.walletAddress;
  await session.save();

  return NextResponse.json({
    userId: user.id,
    walletAddress: user.walletAddress,
    username: user.username,
  });
}
