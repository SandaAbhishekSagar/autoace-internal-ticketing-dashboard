import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { inviteUserSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });

    // Allow ADMIN for full list; allow ENGINEER/ADMIN for engineer-filtered list
    const roleParam = req.nextUrl.searchParams.get("role");
    if (roleParam) {
      if (!dbUser || !["ENGINEER", "ADMIN"].includes(dbUser.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const roles = roleParam.split(",") as ("SUBMITTER" | "OPERATOR" | "ENGINEER" | "ADMIN")[];
      const users = await prisma.user.findMany({
        where: { role: { in: roles } },
        select: { id: true, name: true, role: true, email: true },
        orderBy: { name: "asc" },
      });
      return NextResponse.json({ users });
    }

    if (!dbUser || dbUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isOnCall: true,
        createdAt: true,
        _count: {
          select: { submittedTickets: true },
        },
      },
    });

    return NextResponse.json({ users });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
    if (!dbUser || dbUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = inviteUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { name, email, role } = parsed.data;
    const tempPassword = `TempPass${Math.random().toString(36).slice(2, 10)}!`;

    const serviceClient = createSupabaseServiceClient();
    const { data: authUser, error: authError } =
      await serviceClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { name },
      });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        role,
        supabaseId: authUser.user.id,
      },
    });

    return NextResponse.json(
      { user: newUser, tempPassword },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
