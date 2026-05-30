import { NextResponse } from "next/server";
import { adicionarItemCarrinho, limparCarrinho, obterCarrinho, definirItemCarrinho } from "@/lib/store";

export const dynamic = "force-dynamic";

const COOKIE_CARRINHO = "catarino_cart_id";

function obterIdCarrinho(request) {
  return request.cookies.get(COOKIE_CARRINHO)?.value;
}

function respostaCarrinho(carrinho, status = 200) {
  const response = NextResponse.json({ cart: carrinho }, { status });
  response.cookies.set(COOKIE_CARRINHO, carrinho.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export async function GET(request) {
  const carrinho = await obterCarrinho(obterIdCarrinho(request));
  return respostaCarrinho(carrinho);
}

export async function POST(request) {
  const body = await request.json();
  if (!body.productId) {
    return NextResponse.json({ error: "Produto não informado." }, { status: 400 });
  }

  const carrinho = await adicionarItemCarrinho(obterIdCarrinho(request), body.productId, body.quantity || 1);
  return respostaCarrinho(carrinho, 201);
}

export async function PATCH(request) {
  const body = await request.json();
  if (!body.productId) {
    return NextResponse.json({ error: "Produto não informado." }, { status: 400 });
  }

  const carrinho = await definirItemCarrinho(obterIdCarrinho(request), body.productId, body.quantity);
  return respostaCarrinho(carrinho);
}

export async function DELETE(request) {
  let body = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const cartId = obterIdCarrinho(request);
  const carrinho = body.productId ? await definirItemCarrinho(cartId, body.productId, 0) : await limparCarrinho(cartId);
  return respostaCarrinho(carrinho);
}
