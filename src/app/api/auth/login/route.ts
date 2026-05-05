import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, authenticateAdmin, createSessionToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };

    const username = body.username?.trim() || "";
    const password = body.password || "";

    if (!(await authenticateAdmin(username, password))) {
      return NextResponse.json(
        { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ ok: true, username });
    response.cookies.set({
      name: ADMIN_SESSION_COOKIE,
      value: await createSessionToken(username),
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