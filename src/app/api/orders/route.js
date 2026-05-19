import { NextResponse } from "next/server";
import { getUserBySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { createOrder } from "@/lib/store";

export const dynamic = "force-dynamic";

const CART_COOKIE = "catarino_cart_id";

export async function POST(request) {
  const body = await request.json();
  const cartId = request.cookies.get(CART_COOKIE)?.value;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await getUserBySessionToken(token) : null;

  if (!cartId) {
    return NextResponse.json({ error: "Carrinho não encontrado." }, { status: 400 });
  }

  if (!user) {
    return NextResponse.json({ error: "Faça login para finalizar a compra.", loginRequired: true }, { status: 401 });
  }

  const order = await createOrder(cartId, {
    cep: body.cep,
    couponCode: body.couponCode,
    userId: user.id,
  });

  return NextResponse.json({ order }, { status: 201 });
}
