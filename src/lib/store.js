import crypto from "node:crypto";
import { query } from "@/lib/db";
import { cuponsFallback, produtosFallback } from "@/lib/fallback-data";
import { createAliExpressSupplierOrder, getAffiliateProduct, parseAliExpressProductId } from "@/lib/aliexpress";
import { normalizarProduto } from "@/lib/format";
import { downloadProductImages, draftFromLink, parseProductLinks, scrapeProductPage } from "@/lib/product-importer";

const armazenamentoGlobal = globalThis;

if (!armazenamentoGlobal.__catarinoMemory) {
  armazenamentoGlobal.__catarinoMemory = { carts: new Map(), orders: [], products: [] };
}
if (!armazenamentoGlobal.__catarinoMemory.products) {
  armazenamentoGlobal.__catarinoMemory.products = [];
}

const memoria = armazenamentoGlobal.__catarinoMemory;

function salvarProdutoEmMemoria(produto) {
  const idx = memoria.products.findIndex((p) => p.id === produto.id);
  if (idx >= 0) {
    memoria.products[idx] = produto;
  } else {
    memoria.products.unshift(produto);
  }
  return produto;
}

function arredondarDinheiro(valor) {
  return Math.round((Number(valor || 0) + Number.EPSILON) * 100) / 100;
}

function normalizarLinhas(rows) {
  return rows.map(normalizarProduto);
}

function gerarSlug(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function precoVendaDoCusto(custo, margemPercent) {
  const base = Number(custo || 0);
  const margem = Number(margemPercent || 0);
  return arredondarDinheiro(base + base * (margem / 100));
}

async function comFallback(trabalho, fallback) {
  try {
    return await trabalho();
  } catch (error) {
    console.warn(`[catarino-prime] usando fallback em memória: ${error.message}`);
    return fallback();
  }
}

function produtosEmMemoria() {
  const ids = new Set(memoria.products.map((p) => p.id));
  return [...memoria.products, ...produtosFallback.filter((p) => !ids.has(p.id))];
}

export async function obterProdutos() {
  return comFallback(
    async () => {
      const { rows } = await query(
        "select * from products where product_status = 'published' order by is_kit asc, is_featured desc, name asc"
      );
      return normalizarLinhas(rows);
    },
    () => produtosEmMemoria().filter((produto) => (produto.product_status || "published") === "published")
  );
}

export async function obterProdutosDestaque() {
  return comFallback(
    async () => {
      const { rows } = await query(
        "select * from products where is_featured = true and product_status = 'published' order by name asc"
      );
      return normalizarLinhas(rows);
    },
    () => produtosEmMemoria().filter((produto) => produto.is_featured && (produto.product_status || "published") === "published")
  );
}

export async function obterProdutosKit() {
  return comFallback(
    async () => {
      const { rows } = await query(
        "select * from products where is_kit = true and product_status = 'published' order by name asc"
      );
      return normalizarLinhas(rows);
    },
    () => produtosEmMemoria().filter((produto) => produto.is_kit && (produto.product_status || "published") === "published")
  );
}

export async function obterProdutoPorSlug(slug) {
  return comFallback(
    async () => {
      const { rows } = await query("select * from products where slug = $1 and product_status = 'published' limit 1", [slug]);
      return rows[0] ? normalizarProduto(rows[0]) : null;
    },
    () => produtosEmMemoria().find((produto) => produto.slug === slug && (produto.product_status || "published") === "published") || null
  );
}

export async function obterProdutoPorId(id) {
  return comFallback(
    async () => {
      const { rows } = await query("select * from products where id = $1 limit 1", [id]);
      return rows[0] ? normalizarProduto(rows[0]) : null;
    },
    () => produtosEmMemoria().find((produto) => produto.id === id) || null
  );
}

export async function importarProdutoAliExpress({ productInput, markupPercent = 40 }) {
  const aliProduto = await getAffiliateProduct(productInput);
  const produtoId = `ali-${aliProduto.externalProductId}`;
  const slug = `${gerarSlug(aliProduto.title) || "produto-aliexpress"}-${aliProduto.externalProductId}`;
  const preco = precoVendaDoCusto(aliProduto.supplierCost, markupPercent);
  const galeria = aliProduto.galleryImages.length ? aliProduto.galleryImages : [aliProduto.imageUrl].filter(Boolean);
  const specs = aliProduto.specs?.length
    ? aliProduto.specs
    : [];
  const videos = aliProduto.videos || [];

  return comFallback(
    async () => {
      const { rows } = await query(
        `insert into products (
          id, slug, name, brand, category, sku, code, description, price, old_price, stock, rating, review_count,
          image_key, image_url, gallery_images, is_featured, is_kit, specs, source, external_product_id, affiliate_url,
          supplier_cost, supplier_currency, markup_percent, sync_status, product_status, source_url, scrape_status, external_payload, synced_at, videos
        )
        values (
          $1, $2, $3, 'AliExpress', $4, $5, $6, $7, $8, null, $9, $10, $11,
          'aliexpress', $12, $13::jsonb, false, false, $14::jsonb, 'aliexpress', $15, $16,
          $17, $18, $19, 'synced', 'review', $16, 'scraped', $20::jsonb, now(), $21::jsonb
        )
        on conflict (id) do update set
          name = excluded.name,
          category = excluded.category,
          sku = excluded.sku,
          code = excluded.code,
          description = excluded.description,
          price = excluded.price,
          stock = excluded.stock,
          rating = excluded.rating,
          review_count = excluded.review_count,
          image_url = excluded.image_url,
          gallery_images = excluded.gallery_images,
          specs = excluded.specs,
          videos = excluded.videos,
          affiliate_url = excluded.affiliate_url,
          supplier_cost = excluded.supplier_cost,
          supplier_currency = excluded.supplier_currency,
          markup_percent = excluded.markup_percent,
          sync_status = excluded.sync_status,
          product_status = excluded.product_status,
          source_url = excluded.source_url,
          scrape_status = excluded.scrape_status,
          external_payload = excluded.external_payload,
          synced_at = now()
        returning *`,
        [
          produtoId,
          slug,
          aliProduto.title,
          aliProduto.category,
          `ALI-${aliProduto.externalProductId}`,
          aliProduto.externalProductId,
          aliProduto.description,
          preco,
          aliProduto.stock,
          aliProduto.rating,
          aliProduto.reviewCount,
          aliProduto.imageUrl || "/products/hammer.svg",
          JSON.stringify(galeria),
          JSON.stringify(specs),
          aliProduto.externalProductId,
          aliProduto.affiliateUrl,
          aliProduto.supplierCost,
          aliProduto.supplierCurrency,
          Number(markupPercent),
          JSON.stringify(aliProduto.rawPayload || {}),
          JSON.stringify(videos),
        ]
      );

      return normalizarProduto(rows[0]);
    },
    () => salvarProdutoEmMemoria(normalizarProduto({
      id: produtoId, slug, name: aliProduto.title, brand: "AliExpress",
      category: aliProduto.category, sku: `ALI-${aliProduto.externalProductId}`,
      code: aliProduto.externalProductId, description: aliProduto.description,
      price: preco, old_price: null, stock: aliProduto.stock, rating: aliProduto.rating,
      review_count: aliProduto.reviewCount, image_key: "aliexpress",
      image_url: aliProduto.imageUrl || "/products/hammer.svg",
      gallery_images: galeria, is_featured: false, is_kit: false, specs,
      source: "aliexpress", external_product_id: aliProduto.externalProductId,
      affiliate_url: aliProduto.affiliateUrl, supplier_cost: aliProduto.supplierCost,
      supplier_currency: aliProduto.supplierCurrency, markup_percent: Number(markupPercent),
      sync_status: "synced", product_status: "review", source_url: aliProduto.affiliateUrl,
      scrape_status: "scraped", scrape_error: "", external_payload: {}, videos,
      synced_at: new Date().toISOString(),
    }))
  );
}

export async function sincronizarProdutoAliExpress(produtoId) {
  const atual = await obterProdutoPorId(produtoId);
  if (!atual?.external_product_id) {
    throw new Error("Produto não possui vínculo AliExpress.");
  }

  return importarProdutoAliExpress({
    productInput: atual.external_product_id,
    markupPercent: atual.markup_percent || 40,
  });
}

export async function criarProdutoAliExpressManual({ productInput, name, cost, markupPercent = 40, imageUrl = "", images = [], description = "", category = "AliExpress", videoUrl = "" }) {
  const parsedId = parseAliExpressProductId(productInput);
  const externalProductId = /^https?:\/\//i.test(parsedId)
    ? crypto.createHash("sha1").update(String(productInput || "")).digest("hex").slice(0, 12)
    : parsedId;
  const produtoId = `ali-${externalProductId}`;
  const titulo = String(name || `Produto AliExpress ${externalProductId}`).trim();
  const descricao = String(description || titulo).trim();
  const cat = String(category || "AliExpress").trim();
  const preco = precoVendaDoCusto(cost, markupPercent);
  const slug = `${gerarSlug(titulo) || "produto-aliexpress"}-${externalProductId}`;

  // Build gallery: prefer the images array, fall back to imageUrl, then placeholder
  const galeria = images.length
    ? images
    : imageUrl
    ? [imageUrl]
    : ["/products/hammer.svg"];
  const imagemPrincipal = galeria[0];
  const videos = videoUrl ? [{ url: videoUrl, poster: "" }] : [];

  return comFallback(
    async () => {
      const { rows } = await query(
        `insert into products (
          id, slug, name, brand, category, sku, code, description, price, stock, rating, review_count,
          image_key, image_url, gallery_images, is_featured, is_kit, specs, source, external_product_id, affiliate_url,
          supplier_cost, supplier_currency, markup_percent, sync_status, product_status, source_url, scrape_status, external_payload, videos, synced_at
        )
        values (
          $1, $2, $3, 'AliExpress', $4, $5, $6, $7, $8, 999, 5, 0,
          'aliexpress', $9, $10::jsonb, false, false, $11::jsonb, 'aliexpress', $12, $13,
          $14, 'BRL', $15, 'manual', 'review', $13, 'manual', '{}'::jsonb, $16::jsonb, now()
        )
        on conflict (id) do update set
          name = excluded.name,
          category = excluded.category,
          description = excluded.description,
          price = excluded.price,
          image_url = excluded.image_url,
          gallery_images = excluded.gallery_images,
          affiliate_url = excluded.affiliate_url,
          supplier_cost = excluded.supplier_cost,
          markup_percent = excluded.markup_percent,
          product_status = excluded.product_status,
          source_url = excluded.source_url,
          scrape_status = excluded.scrape_status,
          videos = excluded.videos
        returning *`,
        [
          produtoId,
          slug,
          titulo,
          cat,
          `ALI-${externalProductId}`,
          externalProductId,
          descricao,
          preco,
          imagemPrincipal,
          JSON.stringify(galeria),
          JSON.stringify([]),
          externalProductId,
          String(productInput || ""),
          Number(cost || 0),
          Number(markupPercent),
          JSON.stringify(videos),
        ]
      );
      return normalizarProduto(rows[0]);
    },
    () => salvarProdutoEmMemoria(normalizarProduto({
      id: produtoId, slug, name: titulo, brand: "AliExpress", category: cat,
      sku: `ALI-${externalProductId}`, code: externalProductId, description: descricao,
      price: preco, old_price: null, stock: 999, rating: 5, review_count: 0,
      image_key: "aliexpress", image_url: imagemPrincipal,
      gallery_images: galeria, is_featured: false, is_kit: false,
      specs: [], source: "aliexpress",
      external_product_id: externalProductId, affiliate_url: String(productInput || ""),
      supplier_cost: Number(cost || 0), supplier_currency: "BRL",
      markup_percent: Number(markupPercent), sync_status: "manual", product_status: "review",
      source_url: String(productInput || ""), scrape_status: "manual", scrape_error: "",
      external_payload: {}, videos, synced_at: new Date().toISOString(),
    }))
  );
}

async function salvarRascunhoProdutoImportado(rascunho, markupPercent = 40) {
  const slug = `${gerarSlug(rascunho.title) || "produto-importado"}-${rascunho.externalProductId}`;
  const imageUrl = rascunho.images[0] || "/products/hammer.svg";
  const galeria = rascunho.images.length ? rascunho.images : [imageUrl];
  const specs = [];

  const videos = Array.isArray(rascunho.videos) ? rascunho.videos : [];

  const { rows } = await query(
    `insert into products (
      id, slug, name, brand, category, sku, code, description, price, old_price, stock, rating, review_count,
      image_key, image_url, gallery_images, is_featured, is_kit, specs, source, external_product_id, affiliate_url,
      supplier_cost, supplier_currency, markup_percent, sync_status, product_status, source_url, scrape_status,
      scrape_error, external_payload, synced_at, videos
    )
    values (
      $1, $2, $3, 'Catarino Prime', $4, $5, $6, $7, $8, null, 999, 5, 0,
      'imported', $9, $10::jsonb, false, $11, $12::jsonb, 'link-import', $13, $14,
      $15, 'BRL', $16, 'review', 'review', $17, $18, $19, $20::jsonb, now(), $21::jsonb
    )
    on conflict (id) do update set
      slug = excluded.slug,
      name = excluded.name,
      category = excluded.category,
      sku = excluded.sku,
      code = excluded.code,
      description = excluded.description,
      price = excluded.price,
      image_url = excluded.image_url,
      gallery_images = excluded.gallery_images,
      is_kit = excluded.is_kit,
      specs = excluded.specs,
      affiliate_url = excluded.affiliate_url,
      supplier_cost = excluded.supplier_cost,
      markup_percent = excluded.markup_percent,
      sync_status = excluded.sync_status,
      product_status = excluded.product_status,
      source_url = excluded.source_url,
      scrape_status = excluded.scrape_status,
      scrape_error = excluded.scrape_error,
      external_payload = excluded.external_payload,
      videos = case when excluded.videos::text <> '[]' then excluded.videos else products.videos end,
      synced_at = now()
    returning *`,
    [
      rascunho.productId,
      slug,
      rascunho.title,
      rascunho.category,
      `IMP-${rascunho.externalProductId}`,
      rascunho.externalProductId,
      rascunho.description,
      rascunho.price,
      imageUrl,
      JSON.stringify(galeria),
      rascunho.category === "Kits",
      JSON.stringify(specs),
      rascunho.externalProductId,
      rascunho.sourceUrl,
      rascunho.supplierCost,
      Number(markupPercent || 0),
      rascunho.sourceUrl,
      rascunho.scrapeStatus,
      rascunho.scrapeError || null,
      JSON.stringify({ sourceUrl: rascunho.sourceUrl, scrapeStatus: rascunho.scrapeStatus, scrapeError: rascunho.scrapeError || "" }),
      JSON.stringify(videos),
    ]
  );

  return normalizarProduto(rows[0]);
}

export async function importarProdutosPorLinks({ input, markupPercent = 40 }) {
  const links = parseProductLinks(input);
  if (!links.length) {
    throw new Error("Informe pelo menos um link em formato CSV ou uma lista com um link por linha.");
  }

  const produtos = [];
  for (const link of links) {
    if (/aliexpress\.com/i.test(link)) {
      try {
        produtos.push(await importarProdutoAliExpress({ productInput: link, markupPercent }));
        continue;
      } catch {
        // sem credenciais AliExpress — trata como link genérico abaixo
      }
    }

    let rascunho;
    try {
      const raspado = await scrapeProductPage(link);
      const parsedId = parseAliExpressProductId(link);
      const externalProductId = /^https?:\/\//i.test(parsedId)
        ? crypto.createHash("sha1").update(link).digest("hex").slice(0, 12)
        : parsedId;
      const imagensLocais = await downloadProductImages(raspado.images, `imp-${externalProductId}`);
      rascunho = draftFromLink(link, { ...raspado, localImages: imagensLocais }, markupPercent);
      if (!imagensLocais.length && raspado.images.length) {
        rascunho.scrapeStatus = "partial";
        rascunho.scrapeError = "Dados coletados, mas nenhuma imagem pode ser baixada.";
      }
    } catch (error) {
      rascunho = draftFromLink(link, {}, markupPercent, error.message);
    }

    const produto = await comFallback(
      async () => salvarRascunhoProdutoImportado(rascunho, markupPercent),
      () => {
        const slug = `${gerarSlug(rascunho.title) || "produto-importado"}-${rascunho.externalProductId}`;
        const imgUrl = rascunho.images[0] || "/products/hammer.svg";
        return salvarProdutoEmMemoria(normalizarProduto({
          id: rascunho.productId, slug, name: rascunho.title, brand: "Catarino Prime",
          category: rascunho.category || "Ferramentas Eletricas",
          sku: `IMP-${rascunho.externalProductId}`, code: rascunho.externalProductId,
          description: rascunho.description, price: rascunho.price, old_price: null,
          stock: 999, rating: 5, review_count: 0, image_key: "imported",
          image_url: imgUrl, gallery_images: rascunho.images.length ? rascunho.images : [imgUrl],
          is_featured: false, is_kit: false,
          specs: [],
          source: "link-import", external_product_id: rascunho.externalProductId,
          affiliate_url: rascunho.sourceUrl, supplier_cost: rascunho.supplierCost,
          supplier_currency: "BRL", markup_percent: Number(markupPercent),
          sync_status: "review", product_status: "review", source_url: rascunho.sourceUrl,
          scrape_status: rascunho.scrapeStatus, scrape_error: rascunho.scrapeError || "",
          external_payload: {}, videos: Array.isArray(rascunho.videos) ? rascunho.videos : [], synced_at: new Date().toISOString(),
        }));
      }
    );
    produtos.push(produto);
  }
  return produtos;
}

export async function atualizarPrecoProduto(produtoId, { supplierCost, markupPercent = 40 }) {
  const preco = precoVendaDoCusto(supplierCost, markupPercent);
  return comFallback(
    async () => {
      const { rows } = await query(
        `update products set supplier_cost = $1, markup_percent = $2, price = $3 where id = $4 returning *`,
        [supplierCost, markupPercent, preco, produtoId]
      );
      return rows[0] ? normalizarProduto(rows[0]) : null;
    },
    () => {
      const idx = memoria.products.findIndex((p) => p.id === produtoId);
      if (idx < 0) return null;
      memoria.products[idx] = { ...memoria.products[idx], supplier_cost: supplierCost, markup_percent: markupPercent, price: preco };
      return memoria.products[idx];
    }
  );
}

export async function atualizarVideosProduto(produtoId, videos) {
  const lista = Array.isArray(videos) ? videos : [];
  return comFallback(
    async () => {
      const { rows } = await query(
        `update products set videos = $1 where id = $2 returning *`,
        [JSON.stringify(lista), produtoId]
      );
      return rows[0] ? normalizarProduto(rows[0]) : null;
    },
    () => {
      const idx = memoria.products.findIndex((p) => p.id === produtoId);
      if (idx < 0) return null;
      memoria.products[idx] = { ...memoria.products[idx], videos: lista };
      return memoria.products[idx];
    }
  );
}

export async function removerProduto(produtoId) {
  return comFallback(
    async () => {
      await query("delete from cart_items where product_id = $1", [produtoId]);
      await query("delete from products where id = $1", [produtoId]);
      return true;
    },
    () => {
      const idx = memoria.products.findIndex((p) => p.id === produtoId);
      if (idx >= 0) memoria.products.splice(idx, 1);
      return true;
    }
  );
}

export async function atualizarPublicacaoProduto(produtoId, status) {
  const novoStatus = status === "published" ? "published" : "review";
  return comFallback(
    async () => {
      const { rows } = await query(
        "update products set product_status = $1, sync_status = case when $1 = 'published' then 'published' else sync_status end where id = $2 returning *",
        [novoStatus, produtoId]
      );
      return rows[0] ? normalizarProduto(rows[0]) : null;
    },
    () => {
      const idx = memoria.products.findIndex((p) => p.id === produtoId);
      if (idx < 0) return null;
      memoria.products[idx] = {
        ...memoria.products[idx],
        product_status: novoStatus,
        sync_status: novoStatus === "published" ? "published" : memoria.products[idx].sync_status,
      };
      return memoria.products[idx];
    }
  );
}

export async function garantirCarrinho(cartId) {
  if (!cartId) {
    return comFallback(
      async () => {
        const { rows } = await query("insert into carts default values returning id");
        return rows[0].id;
      },
      () => {
        const id = crypto.randomUUID();
        memoria.carts.set(id, new Map());
        return id;
      }
    );
  }

  return comFallback(
    async () => {
      await query("insert into carts (id) values ($1) on conflict (id) do nothing", [cartId]);
      return cartId;
    },
    () => {
      if (!memoria.carts.has(cartId)) {
        memoria.carts.set(cartId, new Map());
      }
      return cartId;
    }
  );
}

export async function obterCarrinho(cartId) {
  const id = await garantirCarrinho(cartId);

  return comFallback(
    async () => {
      const { rows } = await query(
        `select
          p.*,
          ci.quantity
        from cart_items ci
        join products p on p.id = ci.product_id
        where ci.cart_id = $1
        order by ci.created_at asc`,
        [id]
      );

      return montarCarrinho(id, rows.map((row) => ({ product: normalizarProduto(row), quantity: Number(row.quantity) })));
    },
    () => {
      const carrinho = memoria.carts.get(id) ?? new Map();
      memoria.carts.set(id, carrinho);
      const itens = Array.from(carrinho.entries())
        .map(([produtoId, quantidade]) => {
          const produto = produtosFallback.find((entry) => entry.id === produtoId);
          return produto ? { product: produto, quantity: quantidade } : null;
        })
        .filter(Boolean);

      return montarCarrinho(id, itens);
    }
  );
}

export async function adicionarItemCarrinho(cartId, produtoId, quantidade = 1) {
  const id = await garantirCarrinho(cartId);
  const qtd = Math.max(1, Number(quantidade) || 1);

  return comFallback(
    async () => {
      await query(
        `insert into cart_items (cart_id, product_id, quantity)
         values ($1, $2, $3)
         on conflict (cart_id, product_id)
         do update set quantity = cart_items.quantity + excluded.quantity, updated_at = now()`,
        [id, produtoId, qtd]
      );
      await query("update carts set updated_at = now() where id = $1", [id]);
      return obterCarrinho(id);
    },
    () => {
      const carrinho = memoria.carts.get(id) ?? new Map();
      carrinho.set(produtoId, (carrinho.get(produtoId) || 0) + qtd);
      memoria.carts.set(id, carrinho);
      return obterCarrinho(id);
    }
  );
}

export async function definirItemCarrinho(cartId, produtoId, quantidade) {
  const id = await garantirCarrinho(cartId);
  const qtd = Number(quantidade);

  return comFallback(
    async () => {
      if (qtd <= 0) {
        await query("delete from cart_items where cart_id = $1 and product_id = $2", [id, produtoId]);
      } else {
        await query(
          `insert into cart_items (cart_id, product_id, quantity)
           values ($1, $2, $3)
           on conflict (cart_id, product_id)
           do update set quantity = excluded.quantity, updated_at = now()`,
          [id, produtoId, qtd]
        );
      }
      await query("update carts set updated_at = now() where id = $1", [id]);
      return obterCarrinho(id);
    },
    () => {
      const carrinho = memoria.carts.get(id) ?? new Map();
      if (qtd <= 0) {
        carrinho.delete(produtoId);
      } else {
        carrinho.set(produtoId, qtd);
      }
      memoria.carts.set(id, carrinho);
      return obterCarrinho(id);
    }
  );
}

export async function limparCarrinho(cartId) {
  const id = await garantirCarrinho(cartId);

  return comFallback(
    async () => {
      await query("delete from cart_items where cart_id = $1", [id]);
      await query("update carts set updated_at = now() where id = $1", [id]);
      return obterCarrinho(id);
    },
    () => {
      memoria.carts.set(id, new Map());
      return obterCarrinho(id);
    }
  );
}

export async function obterCupom(code) {
  const normalizado = String(code || "").trim().toUpperCase();
  if (!normalizado) return null;

  return comFallback(
    async () => {
      const { rows } = await query("select * from coupons where code = $1 and active = true limit 1", [normalizado]);
      return rows[0] || null;
    },
    () => cuponsFallback.find((cupom) => cupom.code === normalizado && cupom.active) || null
  );
}

export async function calcularDescontoCupom(code, subtotal) {
  const cupom = await obterCupom(code);
  if (!cupom || Number(subtotal) < Number(cupom.min_total)) {
    return { coupon: null, discount: 0 };
  }

  const valor = Number(cupom.value);
  const desconto = cupom.type === "percent" ? Number(subtotal) * (valor / 100) : valor;
  return { coupon: cupom, discount: arredondarDinheiro(Math.min(desconto, Number(subtotal))) };
}

export async function calcularTotaisCarrinho(cartId, { couponCode } = {}) {
  const carrinho = await obterCarrinho(cartId);
  if (!carrinho?.items?.length) throw new Error("Carrinho vazio ou não encontrado");
  const { coupon: cupom, discount: desconto } = await calcularDescontoCupom(couponCode, carrinho.subtotal);
  const frete = carrinho.subtotal >= 199 || cupom?.code === "FRETE199" ? 0 : 24.9;
  const total = arredondarDinheiro(Math.max(0, carrinho.subtotal - desconto + frete));
  return {
    carrinho,
    subtotal: carrinho.subtotal,
    discount: desconto,
    freight: frete,
    total,
    coupon: cupom,
    items: carrinho.items.map((ci) => ({
      product_id: ci.product.id,
      name: ci.product.name,
      quantity: ci.quantity,
      unit_price: ci.product.price,
      image_url: ci.product.image_url,
      external_product_id: ci.product.external_product_id || null,
      supplier_cost: ci.product.supplier_cost || null,
      affiliate_url: ci.product.affiliate_url || null,
    })),
  };
}

export async function criarPedido(cartId, { cep, couponCode, userId, status = "created", paymentProvider = null } = {}) {
  const carrinho = await obterCarrinho(cartId);
  const { coupon: cupom, discount: desconto } = await calcularDescontoCupom(couponCode, carrinho.subtotal);
  const frete = carrinho.subtotal >= 199 || cupom?.code === "FRETE199" ? 0 : 24.9;
  const total = arredondarDinheiro(Math.max(0, carrinho.subtotal - desconto + frete));

  return comFallback(
    async () => {
      const { rows } = await query(
        `insert into orders (user_id, cart_id, subtotal, discount, freight, total, cep, coupon_code, status, payment_provider)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         returning id, status, created_at`,
        [userId || null, carrinho.id, carrinho.subtotal, desconto, frete, total, cep || null, cupom?.code || null, status, paymentProvider]
      );
      const pedidoId = rows[0].id;

      for (const item of carrinho.items) {
        await query(
          `insert into order_items (order_id, product_id, quantity, unit_price, external_product_id, supplier_cost, affiliate_url)
           values ($1, $2, $3, $4, $5, $6, $7)`,
          [
            pedidoId,
            item.product.id,
            item.quantity,
            item.product.price,
            item.product.external_product_id || null,
            item.product.supplier_cost || null,
            item.product.affiliate_url || null,
          ]
        );
      }

      await limparCarrinho(carrinho.id);
      return { id: pedidoId, status: rows[0].status, subtotal: carrinho.subtotal, discount: desconto, freight: frete, total, items: carrinho.items };
    },
    async () => {
      const pedido = {
        id: crypto.randomUUID(),
        user_id: userId || null,
        status,
        subtotal: carrinho.subtotal,
        discount: desconto,
        freight: frete,
        total,
        items: carrinho.items.map((item) => ({
          product_id: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.price,
          external_product_id: item.product.external_product_id || null,
          supplier_cost: item.product.supplier_cost || null,
          affiliate_url: item.product.affiliate_url || null,
        })),
      };
      memoria.orders.push(pedido);
      await limparCarrinho(carrinho.id);
      return pedido;
    }
  );
}

export async function obterDetalhesPedido(pedidoId) {
  return comFallback(
    async () => {
      const { rows: linhasPedido } = await query("select * from orders where id = $1 limit 1", [pedidoId]);
      const pedido = linhasPedido[0];
      if (!pedido) return null;

      const { rows: linhasItens } = await query(
        `select
          oi.product_id,
          oi.quantity,
          oi.unit_price,
          oi.external_product_id,
          oi.supplier_cost,
          oi.affiliate_url,
          p.name,
          p.source,
          p.image_url
        from order_items oi
        join products p on p.id = oi.product_id
        where oi.order_id = $1
        order by p.name asc`,
        [pedidoId]
      );

      return {
        ...pedido,
        subtotal: Number(pedido.subtotal),
        discount: Number(pedido.discount),
        freight: Number(pedido.freight),
        total: Number(pedido.total),
        items: linhasItens.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          supplier_cost: item.supplier_cost ? Number(item.supplier_cost) : null,
        })),
      };
    },
    () => memoria.orders.find((pedido) => pedido.id === pedidoId) || null
  );
}

export async function criarRegistroPagamento(pedido, pagamento) {
  return comFallback(
    async () => {
      const { rows } = await query(
        `insert into payments (
          order_id, provider, provider_payment_id, provider_preference_id, status, amount, currency, checkout_url, raw_payload
        )
        values ($1, $2, $3, $4, $5, $6, 'BRL', $7, $8::jsonb)
        returning *`,
        [
          pedido.id,
          pagamento.provider || "mercado_pago",
          pagamento.providerPaymentId || null,
          pagamento.providerPreferenceId || null,
          pagamento.status || "pending",
          pedido.total,
          pagamento.checkoutUrl || null,
          JSON.stringify(pagamento.rawPayload || {}),
        ]
      );

      if (pagamento.providerPreferenceId) {
        await query("update orders set provider_preference_id = $1 where id = $2", [pagamento.providerPreferenceId, pedido.id]);
      }

      return rows[0];
    },
    () => null
  );
}

export async function atualizarPagamentoFornecedor({ orderId, providerPaymentId, providerPreferenceId, status, rawPayload = {} }) {
  return comFallback(
    async () => {
      const pedido = await obterDetalhesPedido(orderId);
      if (!pedido) return null;

      const { rows: pagamentos } = await query("select id from payments where order_id = $1 order by created_at desc limit 1", [orderId]);

      if (!pagamentos[0]) {
        await query(
          `insert into payments (
            order_id, provider, provider_payment_id, provider_preference_id, status, amount, currency, raw_payload
          )
          values ($1, 'mercado_pago', $2, $3, $4, $5, 'BRL', $6::jsonb)`,
          [orderId, providerPaymentId || null, providerPreferenceId || null, status || "pending", pedido.total, JSON.stringify(rawPayload)]
        );
      }

      await query(
        `update payments
         set provider_payment_id = coalesce($1, provider_payment_id),
             provider_preference_id = coalesce($2, provider_preference_id),
             status = $3,
             raw_payload = $4::jsonb,
             updated_at = now()
         where order_id = $5
           and ($1::text is null or provider_payment_id = $1 or provider_payment_id is null)
           and ($2::text is null or provider_preference_id = $2 or provider_preference_id is null)`,
        [providerPaymentId || null, providerPreferenceId || null, status || "pending", JSON.stringify(rawPayload), orderId]
      );

      if (status === "approved") {
        await marcarPedidoPago(orderId, { providerPaymentId, rawPayload });
      } else if (["rejected", "cancelled", "refunded", "charged_back"].includes(status)) {
        await query("update orders set status = 'failed' where id = $1 and status <> 'paid'", [orderId]);
      }

      return obterDetalhesPedido(orderId);
    },
    () => null
  );
}

export async function marcarPedidoPago(pedidoId, { providerPaymentId = null, rawPayload = {} } = {}) {
  return comFallback(
    async () => {
      await query(
        `update orders
         set status = 'paid',
             paid_at = coalesce(paid_at, now())
         where id = $1`,
        [pedidoId]
      );
      await query(
        `update payments
         set status = 'approved',
             provider_payment_id = coalesce($2, provider_payment_id),
             raw_payload = $3::jsonb,
             updated_at = now()
         where order_id = $1`,
        [pedidoId, providerPaymentId, JSON.stringify(rawPayload)]
      );
      await garantirFulfillmentAliExpress(pedidoId);
      return obterDetalhesPedido(pedidoId);
    },
    () => null
  );
}

export async function garantirFulfillmentAliExpress(pedidoId) {
  return comFallback(
    async () => {
      const { rows: existente } = await query("select * from order_fulfillments where order_id = $1 limit 1", [pedidoId]);
      if (existente[0]) return existente[0];

      const pedido = await obterDetalhesPedido(pedidoId);
      const itensAli = pedido?.items?.filter((item) => item.external_product_id) || [];
      if (!pedido || !itensAli.length) return null;

      let resultado;
      try {
        resultado = await createAliExpressSupplierOrder({
          orderId: pedido.id,
          items: itensAli.map((item) => ({
            productId: item.external_product_id,
            quantity: item.quantity,
          })),
        });
      } catch (error) {
        resultado = {
          status: "pending_supplier_action",
          errorMessage: error.message,
          rawPayload: { error: error.message },
        };
      }

      const { rows } = await query(
        `insert into order_fulfillments (
          order_id, provider, status, external_order_id, error_message, raw_payload
        )
        values ($1, 'aliexpress', $2, $3, $4, $5::jsonb)
        returning *`,
        [
          pedidoId,
          resultado.status || "pending_supplier_action",
          resultado.externalOrderId || null,
          resultado.errorMessage || null,
          JSON.stringify(resultado.rawPayload || {}),
        ]
      );

      if (resultado.status === "supplier_ordered") {
        await query("update orders set status = 'supplier_ordered' where id = $1", [pedidoId]);
      } else {
        await query("update orders set status = 'fulfillment_pending' where id = $1 and status = 'paid'", [pedidoId]);
      }

      return rows[0];
    },
    () => null
  );
}

export async function obterDadosAdminDrop() {
  return comFallback(
    async () => {
      const { rows: produtos } = await query(
        `select id, slug, name, price, stock, source, external_product_id, supplier_cost, markup_percent, sync_status,
                product_status, source_url, scrape_status, scrape_error, synced_at
         from products
         where source in ('aliexpress', 'link-import', 'curated')
         order by case when product_status = 'review' then 0 else 1 end, synced_at desc nulls last, name asc
         limit 50`
      );
      const { rows: pedidos } = await query(
        `select
          o.id,
          o.total,
          o.status,
          o.created_at,
          p.status as payment_status,
          f.status as fulfillment_status,
          f.external_order_id,
          f.tracking_code,
          f.error_message
        from orders o
        left join payments p on p.order_id = o.id
        left join order_fulfillments f on f.order_id = o.id
        where exists (
          select 1 from order_items oi where oi.order_id = o.id and oi.external_product_id is not null
        )
        order by o.created_at desc
        limit 50`
      );

      return {
        products: produtos.map(normalizarProduto),
        orders: pedidos.map((pedido) => ({ ...pedido, total: Number(pedido.total) })),
      };
    },
    () => ({
      products: [...memoria.products].sort((a, b) =>
        a.product_status === "review" && b.product_status !== "review" ? -1 :
        b.product_status === "review" && a.product_status !== "review" ? 1 : 0
      ),
      orders: [],
    })
  );
}

function montarCarrinho(id, itens) {
  const subtotal = arredondarDinheiro(itens.reduce((soma, item) => soma + Number(item.product.price) * item.quantity, 0));
  const frete = subtotal >= 199 || subtotal === 0 ? 0 : 24.9;
  return {
    id,
    items: itens,
    count: itens.reduce((soma, item) => soma + item.quantity, 0),
    subtotal,
    freight: frete,
    total: arredondarDinheiro(subtotal + frete),
  };
}
