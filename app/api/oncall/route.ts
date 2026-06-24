import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const onCall = await prisma.user.findFirst({
      where: { isOnCall: true, role: { in: ["ENGINEER", "ADMIN"] } },
      select: { id: true, name: true, role: true },
    });
    return NextResponse.json({ onCall });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ onCall: null });
  }
}
