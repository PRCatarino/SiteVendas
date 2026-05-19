import crypto from "node:crypto";

const API_URL = "https://api.mercadopago.com";

function token() {
  return process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
}

export function hasMercadoPagoToken() {
  return Boolean(token());
}

export function siteUrl() {
  return (process.env.PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

async function mercadoPagoRequest(path, options = {}) {
  if (!token()) {
    throw new Error("Token Mercado Pago não configurado.");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || "Falha na API Mercado Pago.");
  }

  return data;
}

export async function createCheckoutPreference(order) {
  const baseUrl = siteUrl();
  const payload = {
    items: order.items.map((item) => ({
      id: item.product_id,
      title: item.name,
      quantity: item.quantity,
      unit_price: Number(item.unit_price),
      currency_id: "BRL",
    })),
    external_reference: order.id,
    notification_url: `${baseUrl}/api/webhooks/mercado-pago?source_news=webhooks`,
    back_urls: {
      success: `${baseUrl}/minha-conta`,
      failure: `${baseUrl}/carrinho`,
      pending: `${baseUrl}/minha-conta`,
    },
    auto_return: "approved",
  };

  return mercadoPagoRequest("/checkout/preferences", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getPayment(paymentId) {
  return mercadoPagoRequest(`/v1/payments/${paymentId}`, { method: "GET" });
}

export function verifyWebhookSignature({ dataId, requestId, signatureHeader }) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET || "";
  if (!secret) return true;
  if (!dataId || !requestId || !signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [String(key || "").trim(), String(value || "").trim()];
    })
  );

  if (!parts.ts || !parts.v1) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${parts.ts};`;
  const digest = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  if (digest.length !== parts.v1.length) return false;
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(parts.v1));
}
