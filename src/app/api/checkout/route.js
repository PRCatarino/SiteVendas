import { NextResponse } from "next/server";
import { obterUsuarioPorToken, COOKIE_SESSAO } from "@/lib/auth";
import { calcularTotaisCarrinho, criarPedido, criarRegistroPagamento, obterDetalhesPedido } from "@/lib/store";
import { createCheckoutSession, hasStripe } from "@/lib/stripe";

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

  // Calculate totals without touching the DB yet
  let draft;
  try {
    draft = await calcularTotaisCarrinho(cartId, { couponCode: body.couponCode });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // If Stripe is not configured, create the order and return a pending state
  if (!hasStripe()) {
    const pedidoPendente = await criarPedido(cartId, {
      cep: body.cep,
      couponCode: body.couponCode,
      userId: usuario.id,
      status: "pending_payment",
      paymentProvider: "stripe",
    });
    const pedido = await obterDetalhesPedido(pedidoPendente.id);
    await criarRegistroPagamento(pedido, {
      provider: "stripe",
      status: "pending_configuration",
      rawPayload: { reason: "STRIPE_SECRET_KEY não configurada." },
    });
    return NextResponse.json(
      {
        order: pedido,
        checkoutUrl: null,
        paymentPending: true,
        message: "Pedido criado. Configure a chave Stripe para gerar o link de pagamento.",
      },
      { status: 201 }
    );
  }

  // Try Stripe BEFORE creating the order — no orphan orders on failure
  let session;
  try {
    session = await createCheckoutSession(draft);
  } catch (err) {
    console.error("[checkout] Stripe error:", err.message);
    return NextResponse.json(
      { error: `Erro ao gerar link de pagamento: ${err.message}` },
      { status: 500 }
    );
  }

  // Stripe succeeded — now persist the order and clear the cart
  const pedidoPendente = await criarPedido(cartId, {
    cep: body.cep,
    couponCode: body.couponCode,
    userId: usuario.id,
    status: "pending_payment",
    paymentProvider: "stripe",
  });
  const pedido = await obterDetalhesPedido(pedidoPendente.id);

  await criarRegistroPagamento(pedido, {
    provider: "stripe",
    providerPreferenceId: session.id,
    status: "pending",
    checkoutUrl: session.url,
    rawPayload: { id: session.id, url: session.url, status: session.status },
  });

  return NextResponse.json(
    {
      order: { ...pedido, provider_preference_id: session.id },
      checkoutUrl: session.url,
    },
    { status: 201 }
  );
}
