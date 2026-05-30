import { NextResponse } from "next/server";
import { excluirSessao, COOKIE_SESSAO } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const token = request.cookies.get(COOKIE_SESSAO)?.value;
  await excluirSessao(token);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_SESSAO, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
