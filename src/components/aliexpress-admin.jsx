"use client";

import { useState } from "react";
import { RefreshCw, Save, UploadCloud } from "lucide-react";
import { money } from "@/lib/format";

export function AliExpressAdmin({ initialProducts, initialOrders }) {
  const [products, setProducts] = useState(initialProducts);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    productInput: "",
    markupPercent: 40,
    manual: false,
    name: "",
    cost: "",
    imageUrl: "",
  });

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function importProduct(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/aliexpress/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        markupPercent: Number(form.markupPercent || 0),
        cost: Number(form.cost || 0),
      }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error || "Não foi possível importar o produto.");
      return;
    }

    setProducts((current) => [data.product, ...current.filter((product) => product.id !== data.product.id)]);
    setMessage("Produto AliExpress salvo no catálogo.");
  }

  async function syncProduct(productId) {
    setMessage("");
    const response = await fetch(`/api/admin/aliexpress/products/${productId}/sync`, { method: "POST" });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Não foi possível sincronizar.");
      return;
    }

    setProducts((current) => current.map((product) => (product.id === productId ? data.product : product)));
    setMessage("Produto sincronizado.");
  }

  return (
    <main className="admin-main">
      <section className="container admin-heading">
        <div>
          <span>Integração de drop</span>
          <h1>AliExpress + Mercado Pago</h1>
        </div>
        <p>Produtos importados vendem no site; pagamento é confirmado por webhook antes do fulfillment.</p>
      </section>

      <section className="container admin-grid">
        <form className="admin-panel admin-form" onSubmit={importProduct}>
          <h2>Importar produto</h2>
          <label>
            Link ou ID AliExpress
            <input
              value={form.productInput}
              onChange={(event) => updateField("productInput", event.target.value)}
              placeholder="https://pt.aliexpress.com/item/..."
            />
          </label>
          <label>
            Margem (%)
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.markupPercent}
              onChange={(event) => updateField("markupPercent", event.target.value)}
            />
          </label>
          <label className="admin-toggle">
            <input
              type="checkbox"
              checked={form.manual}
              onChange={(event) => updateField("manual", event.target.checked)}
            />
            Cadastrar manualmente se a Affiliate API ainda não estiver pronta
          </label>
          {form.manual && (
            <div className="admin-manual-fields">
              <label>
                Nome do produto
                <input value={form.name} onChange={(event) => updateField("name", event.target.value)} />
              </label>
              <label>
                Custo fornecedor
                <input type="number" min="0" step="0.01" value={form.cost} onChange={(event) => updateField("cost", event.target.value)} />
              </label>
              <label>
                URL da imagem
                <input value={form.imageUrl} onChange={(event) => updateField("imageUrl", event.target.value)} />
              </label>
            </div>
          )}
          <button className="button button-primary" type="submit" disabled={loading}>
            {form.manual ? <Save size={18} /> : <UploadCloud size={18} />}
            {loading ? "Salvando..." : "Salvar produto"}
          </button>
          {message && <p className="admin-message">{message}</p>}
        </form>

        <section className="admin-panel">
          <h2>Pedidos drop</h2>
          <div className="admin-table">
            <div className="admin-table-head order-head">
              <span>Pedido</span>
              <span>Total</span>
              <span>Pagamento</span>
              <span>Fulfillment</span>
            </div>
            {initialOrders.length === 0 && <p className="admin-empty">Nenhum pedido AliExpress ainda.</p>}
            {initialOrders.map((order) => (
              <div className="admin-row order-head" key={order.id}>
                <span>{order.id.slice(0, 8)}</span>
                <strong>{money(order.total)}</strong>
                <span>{order.payment_status || order.status}</span>
                <span>{order.fulfillment_status || "aguardando"}</span>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="container admin-panel products-admin-panel">
        <h2>Produtos AliExpress</h2>
        <div className="admin-table">
          <div className="admin-table-head products-head">
            <span>Produto</span>
            <span>Custo</span>
            <span>Venda</span>
            <span>Estoque</span>
            <span>Status</span>
            <span />
          </div>
          {products.length === 0 && <p className="admin-empty">Nenhum produto importado.</p>}
          {products.map((product) => (
            <div className="admin-row products-head" key={product.id}>
              <span>{product.name}</span>
              <span>{product.supplier_cost ? money(product.supplier_cost) : "-"}</span>
              <strong>{money(product.price)}</strong>
              <span>{product.stock}</span>
              <span>{product.sync_status}</span>
              <button className="icon-button" type="button" onClick={() => syncProduct(product.id)} aria-label="Sincronizar">
                <RefreshCw size={18} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
