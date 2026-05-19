export function money(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

export function installmentText(total, installments = 3) {
  return `em até ${installments}x sem juros de ${money(Number(total || 0) / installments)}`;
}

export function normalizeProduct(row) {
  return {
    ...row,
    price: Number(row.price),
    old_price: row.old_price ? Number(row.old_price) : null,
    rating: Number(row.rating),
    review_count: Number(row.review_count),
    stock: Number(row.stock),
    supplier_cost: row.supplier_cost ? Number(row.supplier_cost) : null,
    markup_percent: row.markup_percent ? Number(row.markup_percent) : 0,
    freight_estimate: row.freight_estimate ? Number(row.freight_estimate) : null,
    source: row.source || "local",
    external_product_id: row.external_product_id || "",
    affiliate_url: row.affiliate_url || "",
    supplier_currency: row.supplier_currency || "BRL",
    sync_status: row.sync_status || "manual",
    synced_at: row.synced_at || null,
    is_featured: Boolean(row.is_featured),
    is_kit: Boolean(row.is_kit),
    image_url: row.image_url || `/products/${row.image_key || "hammer"}.svg`,
    gallery_images: Array.isArray(row.gallery_images) && row.gallery_images.length
      ? row.gallery_images
      : [row.image_url || `/products/${row.image_key || "hammer"}.svg`],
    specs: Array.isArray(row.specs) ? row.specs : [],
  };
}
