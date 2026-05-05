import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, createSessionToken } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { supabase } from "@/lib/supabase";
import type { AdminUser } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };

    const username = body.username?.trim() || "";
    const password = body.password || "";

    const { data, error } = await supabase
      .from("admin_users")
      .select("id, username, password_hash, role, is_active")
      .eq("username", username)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const user = data as Pick<AdminUser, "id" | "username" | "password_hash" | "role" | "is_active"> | null;
    const userRole = user?.role === "super_admin" || user?.role === "editor" ? user.role : null;

    if (!user || !userRole || !user.is_active || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json(
        { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ ok: true, username: user.username, role: userRole });
    response.cookies.set({
      name: ADMIN_SESSION_COOKIE,
      value: await createSessionToken({
        userId: user.id,
        username: user.username,
        role: userRole,
      }),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "ไม่สามารถเข้าสู่ระบบได้" }, { status: 500 });
  }
}