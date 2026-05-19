import { query } from "@/lib/db";
import { fallbackCoupons, fallbackProducts } from "@/lib/fallback-data";
import { createAliExpressSupplierOrder, getAffiliateProduct, parseAliExpressProductId } from "@/lib/aliexpress";
import { normalizeProduct } from "@/lib/format";

const globalStore = globalThis;

if (!globalStore.__catarinoMemory) {
  globalStore.__catarinoMemory = {
    carts: new Map(),
    orders: [],
  };
}

const memory = globalStore.__catarinoMemory;

function roundMoney(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function normalizeRows(rows) {
  return rows.map(normalizeProduct);
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function salePriceFromCost(cost, markupPercent) {
  const base = Number(cost || 0);
  const markup = Number(markupPercent || 0);
  return roundMoney(base + base * (markup / 100));
}

async function withFallback(work, fallback) {
  try {
    return await work();
  } catch (error) {
    console.warn(`[catarino-prime] usando fallback em memória: ${error.message}`);
    return fallback();
  }
}

export async function getProducts() {
  return withFallback(
    async () => {
      const { rows } = await query("select * from products order by is_kit asc, is_featured desc, name asc");
      return normalizeRows(rows);
    },
    () => fallbackProducts
  );
}

export async function getFeaturedProducts() {
  return withFallback(
    async () => {
      const { rows } = await query(
        "select * from products where is_featured = true order by array_position(array['hammer','screwdrivers','pliers','wrench','tape','sockets'], id)"
      );
      return normalizeRows(rows);
    },
    () => fallbackProducts.filter((product) => product.is_featured)
  );
}

export async function getKitProducts() {
  return withFallback(
    async () => {
      const { rows } = await query(
        "select * from products where is_kit = true order by array_position(array['kit110','kit85','kit150'], id)"
      );
      return normalizeRows(rows);
    },
    () => fallbackProducts.filter((product) => product.is_kit)
  );
}

export async function getProductBySlug(slug) {
  return withFallback(
    async () => {
      const { rows } = await query("select * from products where slug = $1 limit 1", [slug]);
      return rows[0] ? normalizeProduct(rows[0]) : null;
    },
    () => fallbackProducts.find((product) => product.slug === slug) || null
  );
}

export async function getProductById(id) {
  return withFallback(
    async () => {
      const { rows } = await query("select * from products where id = $1 limit 1", [id]);
      return rows[0] ? normalizeProduct(rows[0]) : null;
    },
    () => fallbackProducts.find((product) => product.id === id) || null
  );
}

export async function importAliExpressProduct({ productInput, markupPercent = 40 }) {
  const aliProduct = await getAffiliateProduct(productInput);
  const productId = `ali-${aliProduct.externalProductId}`;
  const slug = `${slugify(aliProduct.title) || "produto-aliexpress"}-${aliProduct.externalProductId}`;
  const price = salePriceFromCost(aliProduct.supplierCost, markupPercent);
  const gallery = aliProduct.galleryImages.length ? aliProduct.galleryImages : [aliProduct.imageUrl].filter(Boolean);

  return withFallback(
    async () => {
      const { rows } = await query(
        `insert into products (
          id, slug, name, brand, category, sku, code, description, price, old_price, stock, rating, review_count,
          image_key, image_url, gallery_images, is_featured, is_kit, specs, source, external_product_id, affiliate_url,
          supplier_cost, supplier_currency, markup_percent, sync_status, external_payload, synced_at
        )
        values (
          $1, $2, $3, 'AliExpress', $4, $5, $6, $7, $8, null, $9, $10, $11,
          'aliexpress', $12, $13::jsonb, false, false, $14::jsonb, 'aliexpress', $15, $16,
          $17, $18, $19, 'synced', $20::jsonb, now()
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
          affiliate_url = excluded.affiliate_url,
          supplier_cost = excluded.supplier_cost,
          supplier_currency = excluded.supplier_currency,
          markup_percent = excluded.markup_percent,
          sync_status = excluded.sync_status,
          external_payload = excluded.external_payload,
          synced_at = now()
        returning *`,
        [
          productId,
          slug,
          aliProduct.title,
          aliProduct.category,
          `ALI-${aliProduct.externalProductId}`,
          aliProduct.externalProductId,
          aliProduct.description,
          price,
          aliProduct.stock,
          aliProduct.rating,
          aliProduct.reviewCount,
          aliProduct.imageUrl || "/products/hammer.svg",
          JSON.stringify(gallery),
          JSON.stringify([`Produto importado do AliExpress`, `Margem aplicada: ${Number(markupPercent)}%`]),
          aliProduct.externalProductId,
          aliProduct.affiliateUrl,
          aliProduct.supplierCost,
          aliProduct.supplierCurrency,
          Number(markupPercent),
          JSON.stringify(aliProduct.rawPayload || {}),
        ]
      );

      return normalizeProduct(rows[0]);
    },
    () => {
      throw new Error("Banco de dados indisponível para importar produtos AliExpress.");
    }
  );
}

export async function syncAliExpressProduct(productId) {
  const current = await getProductById(productId);
  if (!current?.external_product_id) {
    throw new Error("Produto não possui vínculo AliExpress.");
  }

  return importAliExpressProduct({
    productInput: current.external_product_id,
    markupPercent: current.markup_percent || 40,
  });
}

export async function createManualAliExpressProduct({ productInput, name, cost, markupPercent = 40, imageUrl = "" }) {
  const externalProductId = parseAliExpressProductId(productInput);
  const productId = `ali-${externalProductId}`;
  const title = String(name || `Produto AliExpress ${externalProductId}`).trim();
  const price = salePriceFromCost(cost, markupPercent);
  const slug = `${slugify(title) || "produto-aliexpress"}-${externalProductId}`;

  return withFallback(
    async () => {
      const { rows } = await query(
        `insert into products (
          id, slug, name, brand, category, sku, code, description, price, stock, rating, review_count,
          image_key, image_url, gallery_images, is_featured, is_kit, specs, source, external_product_id, affiliate_url,
          supplier_cost, supplier_currency, markup_percent, sync_status, external_payload, synced_at
        )
        values (
          $1, $2, $3, 'AliExpress', 'AliExpress', $4, $5, $6, $7, 999, 5, 0,
          'aliexpress', $8, $9::jsonb, false, false, $10::jsonb, 'aliexpress', $11, $12,
          $13, 'BRL', $14, 'manual', '{}'::jsonb, now()
        )
        on conflict (id) do update set
          name = excluded.name,
          price = excluded.price,
          image_url = excluded.image_url,
          gallery_images = excluded.gallery_images,
          affiliate_url = excluded.affiliate_url,
          supplier_cost = excluded.supplier_cost,
          markup_percent = excluded.markup_percent
        returning *`,
        [
          productId,
          slug,
          title,
          `ALI-${externalProductId}`,
          externalProductId,
          title,
          price,
          imageUrl || "/products/hammer.svg",
          JSON.stringify([imageUrl || "/products/hammer.svg"]),
          JSON.stringify(["Produto AliExpress cadastrado manualmente"]),
          externalProductId,
          String(productInput || ""),
          Number(cost || 0),
          Number(markupPercent),
        ]
      );
      return normalizeProduct(rows[0]);
    },
    () => {
      throw new Error("Banco de dados indisponível para cadastrar produtos AliExpress.");
    }
  );
}

export async function ensureCart(cartId) {
  if (!cartId) {
    return withFallback(
      async () => {
        const { rows } = await query("insert into carts default values returning id");
        return rows[0].id;
      },
      () => {
        const id = crypto.randomUUID();
        memory.carts.set(id, new Map());
        return id;
      }
    );
  }

  return withFallback(
    async () => {
      await query("insert into carts (id) values ($1) on conflict (id) do nothing", [cartId]);
      return cartId;
    },
    () => {
      if (!memory.carts.has(cartId)) {
        memory.carts.set(cartId, new Map());
      }
      return cartId;
    }
  );
}

export async function getCart(cartId) {
  const id = await ensureCart(cartId);

  return withFallback(
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

      return cartPayload(id, rows.map((row) => ({ product: normalizeProduct(row), quantity: Number(row.quantity) })));
    },
    () => {
      const cart = memory.carts.get(id) ?? new Map();
      memory.carts.set(id, cart);
      const items = Array.from(cart.entries())
        .map(([productId, quantity]) => {
          const product = fallbackProducts.find((entry) => entry.id === productId);
          return product ? { product, quantity } : null;
        })
        .filter(Boolean);

      return cartPayload(id, items);
    }
  );
}

export async function addCartItem(cartId, productId, quantity = 1) {
  const id = await ensureCart(cartId);
  const amount = Math.max(1, Number(quantity) || 1);

  return withFallback(
    async () => {
      await query(
        `insert into cart_items (cart_id, product_id, quantity)
         values ($1, $2, $3)
         on conflict (cart_id, product_id)
         do update set quantity = cart_items.quantity + excluded.quantity, updated_at = now()`,
        [id, productId, amount]
      );
      await query("update carts set updated_at = now() where id = $1", [id]);
      return getCart(id);
    },
    () => {
      const cart = memory.carts.get(id) ?? new Map();
      cart.set(productId, (cart.get(productId) || 0) + amount);
      memory.carts.set(id, cart);
      return getCart(id);
    }
  );
}

export async function setCartItem(cartId, productId, quantity) {
  const id = await ensureCart(cartId);
  const amount = Number(quantity);

  return withFallback(
    async () => {
      if (amount <= 0) {
        await query("delete from cart_items where cart_id = $1 and product_id = $2", [id, productId]);
      } else {
        await query(
          `insert into cart_items (cart_id, product_id, quantity)
           values ($1, $2, $3)
           on conflict (cart_id, product_id)
           do update set quantity = excluded.quantity, updated_at = now()`,
          [id, productId, amount]
        );
      }
      await query("update carts set updated_at = now() where id = $1", [id]);
      return getCart(id);
    },
    () => {
      const cart = memory.carts.get(id) ?? new Map();
      if (amount <= 0) {
        cart.delete(productId);
      } else {
        cart.set(productId, amount);
      }
      memory.carts.set(id, cart);
      return getCart(id);
    }
  );
}

export async function clearCart(cartId) {
  const id = await ensureCart(cartId);

  return withFallback(
    async () => {
      await query("delete from cart_items where cart_id = $1", [id]);
      await query("update carts set updated_at = now() where id = $1", [id]);
      return getCart(id);
    },
    () => {
      memory.carts.set(id, new Map());
      return getCart(id);
    }
  );
}

export async function getCoupon(code) {
  const normalized = String(code || "").trim().toUpperCase();
  if (!normalized) return null;

  return withFallback(
    async () => {
      const { rows } = await query("select * from coupons where code = $1 and active = true limit 1", [normalized]);
      return rows[0] || null;
    },
    () => fallbackCoupons.find((coupon) => coupon.code === normalized && coupon.active) || null
  );
}

export async function calculateCouponDiscount(code, subtotal) {
  const coupon = await getCoupon(code);
  if (!coupon || Number(subtotal) < Number(coupon.min_total)) {
    return { coupon: null, discount: 0 };
  }

  const value = Number(coupon.value);
  const discount = coupon.type === "percent" ? Number(subtotal) * (value / 100) : value;
  return { coupon, discount: roundMoney(Math.min(discount, Number(subtotal))) };
}

export async function createOrder(cartId, { cep, couponCode, userId, status = "created", paymentProvider = null } = {}) {
  const cart = await getCart(cartId);
  const { coupon, discount } = await calculateCouponDiscount(couponCode, cart.subtotal);
  const freight = cart.subtotal >= 199 || coupon?.code === "FRETE199" ? 0 : 24.9;
  const total = roundMoney(Math.max(0, cart.subtotal - discount + freight));

  return withFallback(
    async () => {
      const client = await query("select 1");
      if (!client) return null;

      const { rows } = await query(
        `insert into orders (user_id, cart_id, subtotal, discount, freight, total, cep, coupon_code, status, payment_provider)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         returning id, status, created_at`,
        [userId || null, cart.id, cart.subtotal, discount, freight, total, cep || null, coupon?.code || null, status, paymentProvider]
      );
      const orderId = rows[0].id;

      for (const item of cart.items) {
        await query(
          `insert into order_items (order_id, product_id, quantity, unit_price, external_product_id, supplier_cost, affiliate_url)
           values ($1, $2, $3, $4, $5, $6, $7)`,
          [
            orderId,
            item.product.id,
            item.quantity,
            item.product.price,
            item.product.external_product_id || null,
            item.product.supplier_cost || null,
            item.product.affiliate_url || null,
          ]
        );
      }

      await clearCart(cart.id);
      return { id: orderId, status: rows[0].status, subtotal: cart.subtotal, discount, freight, total, items: cart.items };
    },
    async () => {
      const order = {
        id: crypto.randomUUID(),
        user_id: userId || null,
        status,
        subtotal: cart.subtotal,
        discount,
        freight,
        total,
        items: cart.items.map((item) => ({
          product_id: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.price,
          external_product_id: item.product.external_product_id || null,
          supplier_cost: item.product.supplier_cost || null,
          affiliate_url: item.product.affiliate_url || null,
        })),
      };
      memory.orders.push(order);
      await clearCart(cart.id);
      return order;
    }
  );
}

export async function getOrderDetails(orderId) {
  return withFallback(
    async () => {
      const { rows: orderRows } = await query("select * from orders where id = $1 limit 1", [orderId]);
      const order = orderRows[0];
      if (!order) return null;

      const { rows: itemRows } = await query(
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
        [orderId]
      );

      return {
        ...order,
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        freight: Number(order.freight),
        total: Number(order.total),
        items: itemRows.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          supplier_cost: item.supplier_cost ? Number(item.supplier_cost) : null,
        })),
      };
    },
    () => memory.orders.find((order) => order.id === orderId) || null
  );
}

export async function createPaymentRecord(order, payment) {
  return withFallback(
    async () => {
      const { rows } = await query(
        `insert into payments (
          order_id, provider, provider_payment_id, provider_preference_id, status, amount, currency, checkout_url, raw_payload
        )
        values ($1, $2, $3, $4, $5, $6, 'BRL', $7, $8::jsonb)
        returning *`,
        [
          order.id,
          payment.provider || "mercado_pago",
          payment.providerPaymentId || null,
          payment.providerPreferenceId || null,
          payment.status || "pending",
          order.total,
          payment.checkoutUrl || null,
          JSON.stringify(payment.rawPayload || {}),
        ]
      );

      if (payment.providerPreferenceId) {
        await query("update orders set provider_preference_id = $1 where id = $2", [payment.providerPreferenceId, order.id]);
      }

      return rows[0];
    },
    () => null
  );
}

export async function updatePaymentFromProvider({ orderId, providerPaymentId, providerPreferenceId, status, rawPayload = {} }) {
  return withFallback(
    async () => {
      const order = await getOrderDetails(orderId);
      if (!order) return null;

      const { rows: payments } = await query("select id from payments where order_id = $1 order by created_at desc limit 1", [orderId]);

      if (!payments[0]) {
        await query(
          `insert into payments (
            order_id, provider, provider_payment_id, provider_preference_id, status, amount, currency, raw_payload
          )
          values ($1, 'mercado_pago', $2, $3, $4, $5, 'BRL', $6::jsonb)`,
          [orderId, providerPaymentId || null, providerPreferenceId || null, status || "pending", order.total, JSON.stringify(rawPayload)]
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
        await markOrderPaid(orderId, { providerPaymentId, rawPayload });
      } else if (["rejected", "cancelled", "refunded", "charged_back"].includes(status)) {
        await query("update orders set status = 'failed' where id = $1 and status <> 'paid'", [orderId]);
      }

      return getOrderDetails(orderId);
    },
    () => null
  );
}

export async function markOrderPaid(orderId, { providerPaymentId = null, rawPayload = {} } = {}) {
  return withFallback(
    async () => {
      await query(
        `update orders
         set status = 'paid',
             paid_at = coalesce(paid_at, now())
         where id = $1`,
        [orderId]
      );
      await query(
        `update payments
         set status = 'approved',
             provider_payment_id = coalesce($2, provider_payment_id),
             raw_payload = $3::jsonb,
             updated_at = now()
         where order_id = $1`,
        [orderId, providerPaymentId, JSON.stringify(rawPayload)]
      );
      await ensureAliExpressFulfillment(orderId);
      return getOrderDetails(orderId);
    },
    () => null
  );
}

export async function ensureAliExpressFulfillment(orderId) {
  return withFallback(
    async () => {
      const { rows: existing } = await query("select * from order_fulfillments where order_id = $1 limit 1", [orderId]);
      if (existing[0]) return existing[0];

      const order = await getOrderDetails(orderId);
      const aliItems = order?.items?.filter((item) => item.external_product_id) || [];
      if (!order || !aliItems.length) return null;

      let result;
      try {
        result = await createAliExpressSupplierOrder({
          orderId: order.id,
          items: aliItems.map((item) => ({
            productId: item.external_product_id,
            quantity: item.quantity,
          })),
        });
      } catch (error) {
        result = {
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
          orderId,
          result.status || "pending_supplier_action",
          result.externalOrderId || null,
          result.errorMessage || null,
          JSON.stringify(result.rawPayload || {}),
        ]
      );

      if (result.status === "supplier_ordered") {
        await query("update orders set status = 'supplier_ordered' where id = $1", [orderId]);
      } else {
        await query("update orders set status = 'fulfillment_pending' where id = $1 and status = 'paid'", [orderId]);
      }

      return rows[0];
    },
    () => null
  );
}

export async function getDropAdminData() {
  return withFallback(
    async () => {
      const { rows: products } = await query(
        `select id, slug, name, price, stock, source, external_product_id, supplier_cost, markup_percent, sync_status, synced_at
         from products
         where source = 'aliexpress'
         order by synced_at desc nulls last, name asc
         limit 50`
      );
      const { rows: orders } = await query(
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
        products: products.map(normalizeProduct),
        orders: orders.map((order) => ({ ...order, total: Number(order.total) })),
      };
    },
    () => ({ products: [], orders: [] })
  );
}

function cartPayload(id, items) {
  const subtotal = roundMoney(items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0));
  const freight = subtotal >= 199 || subtotal === 0 ? 0 : 24.9;
  return {
    id,
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    freight,
    total: roundMoney(subtotal + freight),
  };
}
