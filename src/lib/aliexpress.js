import crypto from "node:crypto";

const API_URL = "https://api-sg.aliexpress.com/sync";

function getConfig() {
  return {
    appKey: process.env.ALIEXPRESS_APP_KEY || "",
    appSecret: process.env.ALIEXPRESS_APP_SECRET || "",
    accessToken: process.env.ALIEXPRESS_ACCESS_TOKEN || "",
    trackingId: process.env.ALIEXPRESS_TRACKING_ID || "",
    orderApiEnabled: process.env.ALIEXPRESS_ORDER_API_ENABLED === "true",
  };
}

function sign(params, appSecret) {
  const base = Object.keys(params)
    .filter((key) => key !== "sign" && params[key] !== undefined && params[key] !== null && params[key] !== "")
    .sort()
    .map((key) => `${key}${params[key]}`)
    .join("");

  return crypto.createHmac("sha256", appSecret).update(base).digest("hex").toUpperCase();
}

function commonParams(method) {
  const config = getConfig();
  const params = {
    app_key: config.appKey,
    format: "json",
    method,
    sign_method: "sha256",
    timestamp: new Date().toISOString().slice(0, 19).replace("T", " "),
    v: "2.0",
  };

  if (config.accessToken) {
    params.session = config.accessToken;
  }

  return params;
}

export function parseAliExpressProductId(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  const idPatterns = [
    /\/item\/(\d+)\.html/i,
    /(?:productId|product_id|itemId|item_id)=(\d+)/i,
    /^(\d{6,})$/,
  ];

  for (const pattern of idPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1];
  }

  return text;
}

export async function callAliExpress(method, payload = {}) {
  const config = getConfig();
  if (!config.appKey || !config.appSecret) {
    throw new Error("Credenciais AliExpress não configuradas.");
  }

  const params = {
    ...commonParams(method),
    ...payload,
  };
  params.sign = sign(params, config.appSecret);

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: new URLSearchParams(params),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error_response) {
    const message = data.error_response?.msg || data.error_response?.sub_msg || "Falha na API AliExpress.";
    throw new Error(message);
  }

  return data;
}

function firstProductFromResponse(data) {
  const candidates = [
    data?.aliexpress_affiliate_productdetail_get_response?.resp_result?.result?.products?.product,
    data?.aliexpress_affiliate_productdetail_get_response?.resp_result?.result?.products,
    data?.resp_result?.result?.products?.product,
    data?.result?.products?.product,
    data?.products?.product,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate[0] || null;
    if (candidate && typeof candidate === "object") return candidate;
  }

  return null;
}

function numberFromAli(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).replace(/[^\d.,-]/g, "").replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

export async function getAffiliateProduct(productInput) {
  const productId = parseAliExpressProductId(productInput);
  const config = getConfig();
  const data = await callAliExpress("aliexpress.affiliate.productdetail.get", {
    product_ids: productId,
    target_currency: "BRL",
    target_language: "PT",
    tracking_id: config.trackingId,
    country: "BR",
  });
  const product = firstProductFromResponse(data);

  if (!product) {
    throw new Error("Produto AliExpress não encontrado na resposta da API.");
  }

  return normalizeAliExpressProduct(productId, product, data);
}

export function normalizeAliExpressProduct(productId, product, rawPayload = {}) {
  const title = product.product_title || product.title || `Produto AliExpress ${productId}`;
  const salePrice = numberFromAli(product.target_sale_price || product.sale_price || product.app_sale_price);
  const originalPrice = numberFromAli(product.target_original_price || product.original_price);
  const image = product.product_main_image_url || product.product_small_image_urls?.string?.[0] || product.image_url || "";
  const detailUrl = product.promotion_link || product.product_detail_url || product.detail_url || "";
  const stock = Number(product.stock || product.product_quantity || 999);

  return {
    externalProductId: productId,
    title,
    description: product.product_description || title,
    category: product.first_level_category_name || product.second_level_category_name || "AliExpress",
    supplierCost: salePrice || originalPrice || 0,
    supplierCurrency: product.target_sale_price_currency || product.currency || "BRL",
    stock: Number.isFinite(stock) ? stock : 999,
    rating: numberFromAli(product.evaluate_rate) || 5,
    reviewCount: Number(product.lastest_volume || product.orders || 0),
    imageUrl: image,
    galleryImages: [image, ...(product.product_small_image_urls?.string || [])].filter(Boolean),
    affiliateUrl: detailUrl,
    rawPayload,
  };
}

export async function createAliExpressSupplierOrder(order) {
  const config = getConfig();
  if (!config.orderApiEnabled) {
    return {
      status: "pending_supplier_action",
      rawPayload: { reason: "AliExpress Order API não habilitada; use compra manual ou solicite acesso de dropshipping." },
    };
  }

  const data = await callAliExpress("aliexpress.trade.buy.placeorder", {
    param_place_order_request4_open_api_d_t_o: JSON.stringify(order),
  });

  return {
    status: "supplier_ordered",
    externalOrderId: data?.result?.order_id || data?.order_id || null,
    rawPayload: data,
  };
}
