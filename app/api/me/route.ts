import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!dbUser) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(dbUser);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
