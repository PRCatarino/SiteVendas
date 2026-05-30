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
import { BarraBeneficios } from "@/components/benefit-bar";
import { GradePagamentos } from "@/components/footer";
import { ImagemProduto } from "@/components/product-image";
import { useToast } from "@/components/toast";
import { formatarDinheiro, textoParcelas } from "@/lib/format";

export function ClienteCarrinho() {
  const router = useRouter();
  const { exibirToast } = useToast();
  const [carrinho, setCarrinho] = useState({ items: [], count: 0, subtotal: 0, freight: 0, total: 0 });
  const [carregando, setCarregando] = useState(true);
  const [cep, setCep] = useState("");
  const [codigoCupom, setCodigoCupom] = useState("");
  const [desconto, setDesconto] = useState(0);
  const [frete, setFrete] = useState(null);
  const [checkoutConcluido, setCheckoutConcluido] = useState(null);

  const resumo = useMemo(() => {
    const valorFrete = frete ? frete.price : carrinho.freight;
    const total = Math.max(0, carrinho.subtotal - desconto + valorFrete);
    return { valorFrete, total };
  }, [carrinho.freight, carrinho.subtotal, desconto, frete]);

  useEffect(() => {
    let ignorar = false;

    async function carregarCarrinhoInicial() {
      const response = await fetch("/api/cart", { cache: "no-store" });
      const data = await response.json();

      if (!ignorar) {
        setCarrinho(data.cart);
        setCarregando(false);
      }
    }

    carregarCarrinhoInicial();

    return () => {
      ignorar = true;
    };
  }, []);

  async function definirQuantidade(produtoId, quantidade) {
    const response = await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: produtoId, quantity: quantidade }),
    });
    const data = await response.json();
    setCarrinho(data.cart);
    setDesconto(0);
    window.dispatchEvent(new Event("cart-updated"));
  }

  async function removerItem(produtoId) {
    const response = await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: produtoId }),
    });
    const data = await response.json();
    setCarrinho(data.cart);
    setDesconto(0);
    exibirToast("Produto removido do carrinho.");
    window.dispatchEvent(new Event("cart-updated"));
  }

  async function limparCarrinho() {
    const response = await fetch("/api/cart", { method: "DELETE" });
    const data = await response.json();
    setCarrinho(data.cart);
    setDesconto(0);
    setFrete(null);
    window.dispatchEvent(new Event("cart-updated"));
    exibirToast("Carrinho limpo.");
  }

  async function calcularFrete() {
    const response = await fetch("/api/freight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cep, subtotal: carrinho.subtotal }),
    });
    const data = await response.json();

    if (!response.ok) {
      exibirToast(data.error || "Não foi possível calcular o frete.");
      return;
    }

    setFrete(data);
    exibirToast(data.message);
  }

  async function aplicarCupom() {
    const response = await fetch("/api/coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: codigoCupom, subtotal: carrinho.subtotal }),
    });
    const data = await response.json();

    if (!response.ok) {
      setDesconto(0);
      exibirToast(data.error || "Cupom inválido.");
      return;
    }

    setDesconto(data.discount);
    exibirToast("Cupom aplicado com sucesso.");
  }

  async function finalizarPedido() {
    if (!carrinho.items.length) {
      exibirToast("Seu carrinho está vazio.");
      return;
    }

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cep, couponCode: codigoCupom }),
    });
    const data = await response.json();

    if (!response.ok) {
      if (data.loginRequired) {
        router.push("/login?next=/carrinho");
        return;
      }
      exibirToast(data.error || "Não foi possível finalizar a compra.");
      return;
    }

    setCheckoutConcluido(data.order);
    setCarrinho({ items: [], count: 0, subtotal: 0, freight: 0, total: 0 });
    setDesconto(0);
    setFrete(null);
    window.dispatchEvent(new Event("cart-updated"));
    exibirToast(data.paymentPending ? data.message : "Pedido criado. Você será direcionado para o pagamento.");

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
          {carregando && <div className="cart-empty">Carregando carrinho...</div>}

          {!carregando && checkoutConcluido && (
            <div className="cart-empty">
              <strong>Pedido criado com sucesso</strong>
              <p>Pedido {checkoutConcluido.id}</p>
              <Link className="button button-primary" href="/">Continuar comprando</Link>
            </div>
          )}

          {!carregando && !checkoutConcluido && carrinho.items.length === 0 && (
            <div className="cart-empty">
              <strong>Seu carrinho está vazio</strong>
              <Link className="button button-primary" href="/">Continuar comprando</Link>
            </div>
          )}

          {!carregando && !checkoutConcluido && carrinho.items.length > 0 && (
            <>
              <div className="cart-table">
                <div className="cart-table-header">
                  <span>Produto</span>
                  <span>Preço Unit.</span>
                  <span>Quantidade</span>
                  <span>Subtotal</span>
                  <span />
                </div>
                {carrinho.items.map(({ product, quantity }) => (
                  <article className="cart-row" key={product.id}>
                    <div className="cart-product">
                      <ImagemProduto product={product} />
                      <div>
                        <h2>{product.name}</h2>
                        <p>Código: {product.code}</p>
                        <small>✓ Em estoque</small>
                      </div>
                    </div>
                    <strong>{formatarDinheiro(product.price)}</strong>
                    <div className="quantity-control compact">
                      <button type="button" onClick={() => definirQuantidade(product.id, quantity - 1)} aria-label="Diminuir">
                        <Minus size={15} />
                      </button>
                      <strong>{quantity}</strong>
                      <button type="button" onClick={() => definirQuantidade(product.id, quantity + 1)} aria-label="Aumentar">
                        <Plus size={15} />
                      </button>
                    </div>
                    <strong>{formatarDinheiro(product.price * quantity)}</strong>
                    <button className="icon-button" type="button" onClick={() => removerItem(product.id)} aria-label="Remover">
                      <Trash2 size={19} />
                    </button>
                  </article>
                ))}
              </div>
              <div className="cart-actions">
                <Link href="/">
                  <ChevronLeft size={16} /> Continuar comprando
                </Link>
                <button type="button" onClick={limparCarrinho}>
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
                <button type="button" onClick={calcularFrete}>Calcular</button>
              </div>
              {frete && (
                <p className="freight-result">
                  <strong>{frete.label}</strong> — Prazo: {frete.deadline}
                  {frete.price > 0 && <> — {formatarDinheiro(frete.price)}</>}
                </p>
              )}
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
                <input value={codigoCupom} onChange={(event) => setCodigoCupom(event.target.value)} placeholder="Digite seu cupom" />
                <button type="button" onClick={aplicarCupom}>Aplicar cupom</button>
              </div>
            </div>
          </section>
        </section>

        <aside className="summary-card">
          <h2>Resumo do Pedido</h2>
          <dl>
            <div>
              <dt>Subtotal ({carrinho.count} {carrinho.count === 1 ? "item" : "itens"})</dt>
              <dd>{formatarDinheiro(carrinho.subtotal)}</dd>
            </div>
            <div>
              <dt>Frete {frete ? `(${frete.label})` : "(estimado)"}</dt>
              <dd>{frete ? formatarDinheiro(frete.price) : carrinho.subtotal >= 199 ? "Grátis" : "Calcular"}</dd>
            </div>
            <div>
              <dt>Descontos</dt>
              <dd className="green">{formatarDinheiro(desconto)}</dd>
            </div>
          </dl>
          <div className="summary-total">
            <span>Total</span>
            <strong>{formatarDinheiro(resumo.total)}</strong>
            <small>{textoParcelas(resumo.total)}</small>
          </div>
          <button className="button button-primary checkout-button" type="button" onClick={finalizarPedido}>
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
            <GradePagamentos />
          </div>
        </aside>
      </div>

      <BarraBeneficios className="cart-benefits" />
    </main>
  );
}
