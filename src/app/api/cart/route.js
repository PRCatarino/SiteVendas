import { NextResponse } from "next/server";
import { addCartItem, clearCart, getCart, setCartItem } from "@/lib/store";

export const dynamic = "force-dynamic";

const CART_COOKIE = "catarino_cart_id";

function getCartId(request) {
  return request.cookies.get(CART_COOKIE)?.value;
}

function cartResponse(cart, status = 200) {
  const response = NextResponse.json({ cart }, { status });
  response.cookies.set(CART_COOKIE, cart.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export async function GET(request) {
  const cart = await getCart(getCartId(request));
  return cartResponse(cart);
}

export async function POST(request) {
  const body = await request.json();
  if (!body.productId) {
    return NextResponse.json({ error: "Produto não informado." }, { status: 400 });
  }

  const cart = await addCartItem(getCartId(request), body.productId, body.quantity || 1);
  return cartResponse(cart, 201);
}

export async function PATCH(request) {
  const body = await request.json();
  if (!body.productId) {
    return NextResponse.json({ error: "Produto não informado." }, { status: 400 });
  }

  const cart = await setCartItem(getCartId(request), body.productId, body.quantity);
  return cartResponse(cart);
}

export async function DELETE(request) {
  let body = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const cartId = getCartId(request);
  const cart = body.productId ? await setCartItem(cartId, body.productId, 0) : await clearCart(cartId);
  return cartResponse(cart);
}
