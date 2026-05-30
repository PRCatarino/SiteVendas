export function formatarDinheiro(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor || 0));
}

export function textoParcelas(total, parcelas = 3) {
  return `em ate ${parcelas}x sem juros de ${formatarDinheiro(Number(total || 0) / parcelas)}`;
}

function limparTextoFornecedor(texto) {
  return String(texto || "")
    .replace(/\s*[-–|]\s*AliExpress\s*\d*/gi, "")
    .replace(/\s*[-–|]\s*aliexpress\.com\s*/gi, "")
    .replace(/\s*\(AliExpress\)\s*/gi, "")
    .trim();
}

export function normalizarProduto(linha) {
  const nome = limparTextoFornecedor(String(linha.name || "")) || String(linha.name || "");
  const descOriginal = String(linha.description || "");
  const descricao = /aliexpress|smarter shopping|better living/i.test(descOriginal) ? nome : descOriginal;
  const marca = /^(fornecedor|aliexpress)$/i.test(String(linha.brand || "")) ? "Catarino Prime" : (linha.brand || "Catarino Prime");
  const specs = Array.isArray(linha.specs)
    ? linha.specs.filter((s) => !/importado por link|margem:|AliExpress|link-import/i.test(String(s?.label || s || "")))
    : [];

  return {
    ...linha,
    name: nome,
    brand: marca,
    description: descricao,
    category: String(linha.category || ""),
    price: Number(linha.price),
    old_price: linha.old_price ? Number(linha.old_price) : null,
    rating: Number(linha.rating),
    review_count: Number(linha.review_count),
    stock: Number(linha.stock),
    supplier_cost: linha.supplier_cost ? Number(linha.supplier_cost) : null,
    markup_percent: linha.markup_percent ? Number(linha.markup_percent) : 0,
    freight_estimate: linha.freight_estimate ? Number(linha.freight_estimate) : null,
    source: linha.source || "local",
    product_status: linha.product_status || "published",
    source_url: linha.source_url || "",
    scrape_status: linha.scrape_status || "",
    scrape_error: linha.scrape_error || "",
    external_product_id: linha.external_product_id || "",
    affiliate_url: linha.affiliate_url || "",
    supplier_currency: linha.supplier_currency || "BRL",
    sync_status: linha.sync_status || "manual",
    synced_at: linha.synced_at || null,
    is_featured: Boolean(linha.is_featured),
    is_kit: Boolean(linha.is_kit),
    image_url: linha.image_url || `/products/${linha.image_key || "hammer"}.svg`,
    gallery_images: Array.isArray(linha.gallery_images) && linha.gallery_images.length
      ? linha.gallery_images
      : [linha.image_url || `/products/${linha.image_key || "hammer"}.svg`],
    specs,
    videos: Array.isArray(linha.videos) ? linha.videos : [],
  };
}
