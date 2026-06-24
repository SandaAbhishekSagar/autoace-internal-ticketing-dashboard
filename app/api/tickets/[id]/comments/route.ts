import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createCommentSchema } from "@/lib/validations";
import { canViewTicket, canManageTickets } from "@/lib/ticket-access";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { body: commentBody, isInternal } = parsed.data;

    const canPostInternal = canManageTickets(dbUser.role);
    if (isInternal && !canPostInternal) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: params.id } });
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    if (!canViewTicket(dbUser, ticket)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const updateData: Record<string, unknown> = {};

    // Auto-set firstResponseAt if engineer/admin comment and not yet set
    if (canPostInternal && !ticket.firstResponseAt) {
      updateData.firstResponseAt = now;
    }

    const comment = await prisma.$transaction(async (tx) => {
      const c = await tx.comment.create({
        data: {
          ticketId: params.id,
          authorId: dbUser.id,
          authorName: dbUser.name,
          body: commentBody,
          isInternal,
        },
        include: {
          author: { select: { role: true } },
        },
      });

      if (Object.keys(updateData).length > 0) {
        await tx.ticket.update({
          where: { id: params.id },
          data: updateData,
        });
      }

      return c;
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
