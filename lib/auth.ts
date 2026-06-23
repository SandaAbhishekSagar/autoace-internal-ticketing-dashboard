import type { Role } from "@prisma/client";
import { createSupabaseServerClient } from "./supabase/server";
import { prisma } from "./prisma";

export async function getCurrentUser() {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    });

    return dbUser;
  } catch {
    return null;
  }
}

export function requireRole(userRole: Role, allowed: Role[]): boolean {
  return allowed.includes(userRole);
}

export const ENGINEER_AND_ABOVE: Role[] = ["ENGINEER", "ADMIN"];
export const OPERATOR_AND_ABOVE: Role[] = ["OPERATOR", "ENGINEER", "ADMIN"];
export const ADMIN_ONLY: Role[] = ["ADMIN"];
export const ALL_ROLES: Role[] = ["SUBMITTER", "OPERATOR", "ENGINEER", "ADMIN"];
