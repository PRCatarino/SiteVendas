import { NextResponse } from "next/server";
import { obterUsuarioPorToken, COOKIE_SESSAO } from "@/lib/auth";
import { criarPedido } from "@/lib/store";

export const dynamic = "force-dynamic";

const COOKIE_CARRINHO = "catarino_cart_id";

export async function POST(request) {
  const body = await request.json();
  const cartId = request.cookies.get(COOKIE_CARRINHO)?.value;
  const token = request.cookies.get(COOKIE_SESSAO)?.value;
  const usuario = token ? await obterUsuarioPorToken(token) : null;

  if (!cartId) {
    return NextResponse.json({ error: "Carrinho não encontrado." }, { status: 400 });
  }

  if (!usuario) {
    return NextResponse.json({ error: "Faça login para finalizar a compra.", loginRequired: true }, { status: 401 });
  }

  const pedido = await criarPedido(cartId, {
    cep: body.cep,
    couponCode: body.couponCode,
    userId: usuario.id,
  });

  return NextResponse.json({ order: pedido }, { status: 201 });
}
