import { NextResponse } from "next/server";
import { getUserBySessionToken, SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await getUserBySessionToken(token) : null;
  return NextResponse.json({ user });
}
