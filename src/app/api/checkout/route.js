import { NextResponse } from "next/server";
import { getUserBySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { createOrder, createPaymentRecord, getOrderDetails } from "@/lib/store";
import { createCheckoutPreference, hasMercadoPagoToken } from "@/lib/mercado-pago";

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

  const pendingOrder = await createOrder(cartId, {
    cep: body.cep,
    couponCode: body.couponCode,
    userId: user.id,
    status: "pending_payment",
    paymentProvider: "mercado_pago",
  });
  const order = await getOrderDetails(pendingOrder.id);

  if (!hasMercadoPagoToken()) {
    await createPaymentRecord(order, {
      status: "pending_configuration",
      rawPayload: { reason: "MERCADO_PAGO_ACCESS_TOKEN não configurado." },
    });

    return NextResponse.json(
      {
        order,
        checkoutUrl: null,
        paymentPending: true,
        message: "Pedido criado. Configure o Mercado Pago para gerar o link de pagamento.",
      },
      { status: 201 }
    );
  }

  const preference = await createCheckoutPreference(order);
  await createPaymentRecord(order, {
    providerPreferenceId: preference.id,
    status: "pending",
    checkoutUrl: preference.init_point || preference.sandbox_init_point || null,
    rawPayload: preference,
  });

  return NextResponse.json(
    {
      order: { ...order, provider_preference_id: preference.id },
      checkoutUrl: preference.init_point || preference.sandbox_init_point || null,
    },
    { status: 201 }
  );
}
