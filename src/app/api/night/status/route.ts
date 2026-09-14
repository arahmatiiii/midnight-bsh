import { NextResponse } from "next/server";
import { getNightWindowStatus } from "@/lib/night";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = getNightWindowStatus();
  return NextResponse.json(status);
}
