import { NextResponse } from "next/server";
import { getPayment, verifyWebhookSignature } from "@/lib/mercado-pago";
import { updatePaymentFromProvider } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const url = new URL(request.url);
  const body = await request.json().catch(() => ({}));
  const dataId = body?.data?.id || body?.id || url.searchParams.get("data.id") || url.searchParams.get("id");
  const requestId = request.headers.get("x-request-id");
  const signatureHeader = request.headers.get("x-signature");

  const valid = verifyWebhookSignature({ dataId, requestId, signatureHeader });
  if (!valid) {
    return NextResponse.json({ error: "Assinatura Mercado Pago inválida." }, { status: 401 });
  }

  if (!dataId) {
    return NextResponse.json({ received: true, ignored: "Sem ID de pagamento." });
  }

  const payment = await getPayment(dataId);
  const orderId = payment.external_reference;

  if (!orderId) {
    return NextResponse.json({ received: true, ignored: "Pagamento sem external_reference." });
  }

  await updatePaymentFromProvider({
    orderId,
    providerPaymentId: String(payment.id || dataId),
    providerPreferenceId: payment.preference_id || null,
    status: payment.status || "pending",
    rawPayload: payment,
  });

  return NextResponse.json({ received: true });
}
