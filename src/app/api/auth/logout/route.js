import { NextResponse } from "next/server";
import { deleteSession, SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  await deleteSession(token);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
