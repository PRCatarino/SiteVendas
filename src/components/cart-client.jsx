"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  CreditCard,
  LockKeyhole,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  Tag,
  Trash2,
  Truck,
} from "lucide-react";
import { BenefitBar } from "@/components/benefit-bar";
import { PaymentGrid } from "@/components/footer";
import { ProductImage } from "@/components/product-image";
import { useToast } from "@/components/toast";
import { installmentText, money } from "@/lib/format";

export function CartClient() {
  const router = useRouter();
  const { showToast } = useToast();
  const [cart, setCart] = useState({ items: [], count: 0, subtotal: 0, freight: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [cep, setCep] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [freight, setFreight] = useState(null);
  const [checkoutDone, setCheckoutDone] = useState(null);

  const summary = useMemo(() => {
    const freightValue = freight ? freight.price : cart.freight;
    const total = Math.max(0, cart.subtotal - discount + freightValue);
    return { freightValue, total };
  }, [cart.freight, cart.subtotal, discount, freight]);

  async function loadCart() {
    const response = await fetch("/api/cart", { cache: "no-store" });
    const data = await response.json();
    setCart(data.cart);
    setLoading(false);
  }

  useEffect(() => {
    let ignore = false;

    async function loadInitialCart() {
      const response = await fetch("/api/cart", { cache: "no-store" });
      const data = await response.json();

      if (!ignore) {
        setCart(data.cart);
        setLoading(false);
      }
    }

    loadInitialCart();

    return () => {
      ignore = true;
    };
  }, []);

  async function setQuantity(productId, quantity) {
    const response = await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity }),
    });
    const data = await response.json();
    setCart(data.cart);
    setDiscount(0);
    window.dispatchEvent(new Event("cart-updated"));
  }

  async function removeItem(productId) {
    const response = await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    const data = await response.json();
    setCart(data.cart);
    setDiscount(0);
    showToast("Produto removido do carrinho.");
    window.dispatchEvent(new Event("cart-updated"));
  }

  async function clearCart() {
    const response = await fetch("/api/cart", { method: "DELETE" });
    const data = await response.json();
    setCart(data.cart);
    setDiscount(0);
    setFreight(null);
    window.dispatchEvent(new Event("cart-updated"));
    showToast("Carrinho limpo.");
  }

  async function calculateFreight() {
    const response = await fetch("/api/freight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cep, subtotal: cart.subtotal }),
    });
    const data = await response.json();

    if (!response.ok) {
      showToast(data.error || "Não foi possível calcular o frete.");
      return;
    }

    setFreight(data);
    showToast(data.message);
  }

  async function applyCoupon() {
    const response = await fetch("/api/coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode, subtotal: cart.subtotal }),
    });
    const data = await response.json();

    if (!response.ok) {
      setDiscount(0);
      showToast(data.error || "Cupom inválido.");
      return;
    }

    setDiscount(data.discount);
    showToast("Cupom aplicado com sucesso.");
  }

  async function finishOrder() {
    if (!cart.items.length) {
      showToast("Seu carrinho está vazio.");
      return;
    }

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cep, couponCode }),
    });
    const data = await response.json();

    if (!response.ok) {
      if (data.loginRequired) {
        router.push("/login?next=/carrinho");
        return;
      }
      showToast(data.error || "Não foi possível finalizar a compra.");
      return;
    }

    setCheckoutDone(data.order);
    setCart({ items: [], count: 0, subtotal: 0, freight: 0, total: 0 });
    setDiscount(0);
    setFreight(null);
    window.dispatchEvent(new Event("cart-updated"));
    showToast(data.paymentPending ? data.message : "Pedido criado. Você será direcionado para o pagamento.");

    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    }
  }

  return (
    <main className="cart-main">
      <div className="container breadcrumb">
        <span>Home</span>
        <span>›</span>
        <strong>Carrinho de Compras</strong>
      </div>

      <div className="container cart-heading">
        <h1>Carrinho de Compras</h1>
        <span>
          <LockKeyhole size={16} /> Ambiente 100% seguro
        </span>
      </div>

      <div className="container cart-layout">
        <section className="cart-panel">
          {loading && <div className="cart-empty">Carregando carrinho...</div>}

          {!loading && checkoutDone && (
            <div className="cart-empty">
              <strong>Pedido criado com sucesso</strong>
              <p>Pedido {checkoutDone.id}</p>
              <Link className="button button-primary" href="/">Continuar comprando</Link>
            </div>
          )}

          {!loading && !checkoutDone && cart.items.length === 0 && (
            <div className="cart-empty">
              <strong>Seu carrinho está vazio</strong>
              <Link className="button button-primary" href="/">Continuar comprando</Link>
            </div>
          )}

          {!loading && !checkoutDone && cart.items.length > 0 && (
            <>
              <div className="cart-table">
                <div className="cart-table-header">
                  <span>Produto</span>
                  <span>Preço Unit.</span>
                  <span>Quantidade</span>
                  <span>Subtotal</span>
                  <span />
                </div>
                {cart.items.map(({ product, quantity }) => (
                  <article className="cart-row" key={product.id}>
                    <div className="cart-product">
                      <ProductImage product={product} />
                      <div>
                        <h2>{product.name}</h2>
                        <p>Código: {product.code}</p>
                        <small>✓ Em estoque</small>
                      </div>
                    </div>
                    <strong>{money(product.price)}</strong>
                    <div className="quantity-control compact">
                      <button type="button" onClick={() => setQuantity(product.id, quantity - 1)} aria-label="Diminuir">
                        <Minus size={15} />
                      </button>
                      <strong>{quantity}</strong>
                      <button type="button" onClick={() => setQuantity(product.id, quantity + 1)} aria-label="Aumentar">
                        <Plus size={15} />
                      </button>
                    </div>
                    <strong>{money(product.price * quantity)}</strong>
                    <button className="icon-button" type="button" onClick={() => removeItem(product.id)} aria-label="Remover">
                      <Trash2 size={19} />
                    </button>
                  </article>
                ))}
              </div>
              <div className="cart-actions">
                <Link href="/">
                  <ChevronLeft size={16} /> Continuar comprando
                </Link>
                <button type="button" onClick={clearCart}>
                  <Trash2 size={16} /> Limpar carrinho
                </button>
              </div>
            </>
          )}

          <section className="cart-extra-grid">
            <div className="freight-coupon-box">
              <h2>
                <Truck size={26} /> Calcule o frete e prazo de entrega
              </h2>
              <p>Digite seu CEP para calcular o frete</p>
              <div className="inline-form wide">
                <input value={cep} onChange={(event) => setCep(event.target.value)} placeholder="Ex.: 01234-567" />
                <button type="button" onClick={calculateFreight}>Calcular</button>
              </div>
            </div>
            <div className="free-shipping-card">
              <Truck size={32} />
              <span>
                <strong>Frete grátis para compras acima de R$199,00</strong>
                Entrega para todo o Brasil com segurança e agilidade.
              </span>
            </div>
            <div className="coupon-box">
              <h2>
                <Tag size={27} /> Cupom de desconto
              </h2>
              <div className="inline-form wide">
                <input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="Digite seu cupom" />
                <button type="button" onClick={applyCoupon}>Aplicar cupom</button>
              </div>
            </div>
          </section>
        </section>

        <aside className="summary-card">
          <h2>Resumo do Pedido</h2>
          <dl>
            <div>
              <dt>Subtotal ({cart.count} {cart.count === 1 ? "item" : "itens"})</dt>
              <dd>{money(cart.subtotal)}</dd>
            </div>
            <div>
              <dt>Frete {freight ? `(${freight.label})` : "(estimado)"}</dt>
              <dd>{freight ? money(freight.price) : cart.subtotal >= 199 ? "Grátis" : "Calcular"}</dd>
            </div>
            <div>
              <dt>Descontos</dt>
              <dd className="green">{money(discount)}</dd>
            </div>
          </dl>
          <div className="summary-total">
            <span>Total</span>
            <strong>{money(summary.total)}</strong>
            <small>{installmentText(summary.total)}</small>
          </div>
          <button className="button button-primary checkout-button" type="button" onClick={finishOrder}>
            <LockKeyhole size={20} /> Finalizar compra
          </button>

          <ul className="summary-benefits">
            <li>
              <ShieldCheck size={24} />
              <span><strong>Ambiente 100% seguro</strong>Seus dados protegidos</span>
            </li>
            <li>
              <PackageCheck size={24} />
              <span><strong>Entrega garantida</strong>Para todo o Brasil</span>
            </li>
            <li>
              <CreditCard size={24} />
              <span><strong>Compra protegida</strong>Garantia Catarino Prime</span>
            </li>
          </ul>

          <div className="summary-payment">
            <h3>Formas de pagamento aceitas</h3>
            <PaymentGrid />
          </div>
        </aside>
      </div>

      <BenefitBar className="cart-benefits" />
    </main>
  );
}
