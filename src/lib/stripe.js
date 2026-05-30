import Stripe from "stripe";

function createStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  // Use fetch-based HTTP client so this works in Cloudflare Workers
  // (nodejs_compat makes Stripe default to Node's https module, which times out)
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    httpClient: Stripe.createFetchHttpClient(),
  });
}

const globalForStripe = globalThis;
export const stripe = globalForStripe.__catarinoStripe ?? createStripeClient();

if (process.env.NODE_ENV !== "production") {
  globalForStripe.__catarinoStripe = stripe;
}

export function hasStripe() {
  return Boolean(stripe);
}

export async function createCheckoutSession(pedido) {
  const lineItems = pedido.items.map((item) => {
    const imgUrl = item.image_url || item.product?.image_url;
    const imagens = imgUrl && imgUrl.startsWith("http") ? { images: [imgUrl] } : {};
    return {
      price_data: {
        currency: "brl",
        product_data: {
          name: item.name || item.product?.name || "Produto",
          ...imagens,
        },
        unit_amount: Math.round((Number(item.unit_price) || 0) * 100),
      },
      quantity: item.quantity,
    };
  });

  if (pedido.freight > 0) {
    lineItems.push({
      price_data: {
        currency: "brl",
        product_data: { name: "Frete" },
        unit_amount: Math.round(Number(pedido.freight) * 100),
      },
      quantity: 1,
    });
  }

  const sessionParams = {
    mode: "payment",
    line_items: lineItems,
    payment_method_types: ["card", "boleto"],
    success_url: `${process.env.PUBLIC_SITE_URL}/minha-conta?pago=1`,
    cancel_url: `${process.env.PUBLIC_SITE_URL}/carrinho`,
    metadata: { order_id: String(pedido.id) },
    payment_intent_data: { metadata: { order_id: String(pedido.id) } },
  };

  if (pedido.discount > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: Math.round(Number(pedido.discount) * 100),
      currency: "brl",
      duration: "once",
      ...(pedido.coupon_code ? { name: `Cupom ${pedido.coupon_code}` } : {}),
    });
    sessionParams.discounts = [{ coupon: coupon.id }];
  }

  return stripe.checkout.sessions.create(sessionParams);
}
