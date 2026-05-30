import { NextResponse } from "next/server";
import { getPayment, verifyWebhookSignature } from "@/lib/mercado-pago";
import { atualizarPagamentoFornecedor } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const url = new URL(request.url);
  const body = await request.json().catch(() => ({}));
  const dataId = body?.data?.id || body?.id || url.searchParams.get("data.id") || url.searchParams.get("id");
  const requestId = request.headers.get("x-request-id");
  const signatureHeader = request.headers.get("x-signature");

  const valido = verifyWebhookSignature({ dataId, requestId, signatureHeader });
  if (!valido) {
    return NextResponse.json({ error: "Assinatura Mercado Pago inválida." }, { status: 401 });
  }

  if (!dataId) {
    return NextResponse.json({ received: true, ignored: "Sem ID de pagamento." });
  }

  const pagamento = await getPayment(dataId);
  const pedidoId = pagamento.external_reference;

  if (!pedidoId) {
    return NextResponse.json({ received: true, ignored: "Pagamento sem external_reference." });
  }

  await atualizarPagamentoFornecedor({
    orderId: pedidoId,
    providerPaymentId: String(pagamento.id || dataId),
    providerPreferenceId: pagamento.preference_id || null,
    status: pagamento.status || "pending",
    rawPayload: pagamento,
  });

  return NextResponse.json({ received: true });
}
