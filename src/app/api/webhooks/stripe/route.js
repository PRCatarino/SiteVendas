import { NextResponse } from "next/server";
import Stripe from "stripe";
import { marcarPedidoPago, atualizarPagamentoFornecedor } from "@/lib/store";

export const dynamic = "force-dynamic";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export async function POST(request) {
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || !sig) {
    return NextResponse.json({ error: "Configuração do webhook incompleta." }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripeClient = getStripe();
  if (!stripeClient) {
    return NextResponse.json({ error: "Stripe não configurado." }, { status: 500 });
  }

  let event;
  try {
    event = await stripeClient.webhooks.constructEventAsync(rawBody, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Assinatura Stripe inválida." }, { status: 401 });
  }

  const session = event.data.object;
  const orderId = session.metadata?.order_id;

  if (!orderId) {
    return NextResponse.json({ received: true, ignored: "Sem order_id nos metadados." });
  }

  if (event.type === "checkout.session.completed") {
    const paymentIntentId = typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

    await marcarPedidoPago(orderId, {
      providerPaymentId: paymentIntentId || session.id,
      rawPayload: { event: event.type, session_id: session.id, payment_intent: paymentIntentId },
    });
  }

  if (event.type === "checkout.session.expired") {
    await atualizarPagamentoFornecedor({
      orderId,
      providerPaymentId: session.id,
      providerPreferenceId: session.id,
      status: "cancelled",
      rawPayload: { event: event.type, session_id: session.id },
    });
  }

  return NextResponse.json({ received: true });
}
