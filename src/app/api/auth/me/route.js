import { NextResponse } from "next/server";
import { obterUsuarioPorToken, COOKIE_SESSAO } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const token = request.cookies.get(COOKIE_SESSAO)?.value;
  const usuario = token ? await obterUsuarioPorToken(token) : null;
  return NextResponse.json({ user: usuario });
}
