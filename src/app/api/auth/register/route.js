import { NextResponse } from "next/server";
import { criarSessao, registrarUsuario, COOKIE_SESSAO } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const usuario = await registrarUsuario(body);
    const sessao = await criarSessao(usuario.id);
    const response = NextResponse.json({ user: usuario }, { status: 201 });
    response.cookies.set(COOKIE_SESSAO, sessao.token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      expires: sessao.expires,
    });
    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
