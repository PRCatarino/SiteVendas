"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  CheckCircle2,
  ChevronRight,
  LockKeyhole,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { PaymentGrid } from "@/components/footer";
import { ProductImage } from "@/components/product-image";
import { useToast } from "@/components/toast";
import { installmentText, money } from "@/lib/format";

export function ProductPurchase({ product }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [cep, setCep] = useState("");
  const [freight, setFreight] = useState(null);
  const [tab, setTab] = useState("description");
  const [loading, setLoading] = useState(false);
  const gallery = product.gallery_images?.length ? product.gallery_images : [product.image_url];
  const [activeImage, setActiveImage] = useState(gallery[0]);

  function changeQuantity(step) {
    setQuantity((current) => Math.max(1, current + step));
  }

  async function addToCart(goToCart = false) {
    setLoading(true);
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity }),
      });

      if (!response.ok) throw new Error("Não foi possível adicionar o produto.");
      window.dispatchEvent(new Event("cart-updated"));
      showToast("Produto adicionado ao carrinho.");
      if (goToCart) router.push("/carrinho");
    } catch (error) {
      showToast(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function calculateFreight() {
    const response = await fetch("/api/freight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cep, subtotal: product.price * quantity }),
    });
    const data = await response.json();

    if (!response.ok) {
      showToast(data.error || "Não foi possível calcular o frete.");
      return;
    }

    setFreight(data);
    showToast(data.message);
  }

  return (
    <main className="product-main">
      <div className="container breadcrumb">
        <span>Página inicial</span>
        <ChevronRight size={14} />
        <span>{product.category}</span>
        <ChevronRight size={14} />
        <strong>{product.name}</strong>
      </div>

      <div className="container product-layout">
        <section className="gallery-card">
          <span className="launch-tag">Lançamento</span>
          <button className="gallery-zoom" type="button" aria-label="Ampliar imagem">
            <Search size={25} />
          </button>
          <ProductImage product={product} src={activeImage} large />
          <div className="thumb-row">
            {gallery.map((image, index) => (
              <button
                className={`thumb-button ${activeImage === image ? "active" : ""}`}
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActiveImage(image)}
                aria-label="Selecionar foto do produto"
              >
                <Image src={image} alt="" width={160} height={120} />
              </button>
            ))}
          </div>
        </section>

        <section className="product-info">
          <small>SKU: {product.sku}</small>
          <h1>{product.name}</h1>
          <p>{product.brand}</p>
          <div className="product-rating">★★★★★ <span>({product.review_count} avaliações)</span></div>
          <strong className="product-page-price">{money(product.price)}</strong>
          <p className="installments">{installmentText(product.price * quantity, 6)}</p>
          <a className="payment-link" href="#formas-pagamento">Ver mais formas de pagamento</a>

          <p className="stock-line">
            <CheckCircle2 size={18} /> Em estoque
          </p>
          <p className="shipping-line">Envio imediato para todo o Brasil</p>
          <p className="product-description">{product.description}</p>

          <ul className="spec-list">
            {product.specs.map((spec) => (
              <li key={spec}>
                <CheckCircle2 size={16} />
                {spec}
              </li>
            ))}
          </ul>
        </section>

        <aside className="buy-box">
          <label>Quantidade:</label>
          <div className="quantity-control">
            <button type="button" onClick={() => changeQuantity(-1)} aria-label="Diminuir quantidade">
              <Minus size={16} />
            </button>
            <strong>{quantity}</strong>
            <button type="button" onClick={() => changeQuantity(1)} aria-label="Aumentar quantidade">
              <Plus size={16} />
            </button>
          </div>

          <button className="button button-primary buy-now" type="button" onClick={() => addToCart(true)} disabled={loading}>
            Comprar agora <ChevronRight size={20} />
          </button>
          <button className="button button-dark" type="button" onClick={() => addToCart(false)} disabled={loading}>
            <ShoppingCart size={20} /> Adicionar ao carrinho
          </button>

          <div className="secure-box">
            <ShieldCheck size={34} />
            <span>
              <strong>Compra 100% segura</strong>
              Ambiente protegido e criptografado
            </span>
          </div>

          <div className="freight-box">
            <h2>
              <Truck size={24} />
              Calcule o prazo e o frete
            </h2>
            <div className="inline-form">
              <input value={cep} onChange={(event) => setCep(event.target.value)} placeholder="Digite seu CEP" />
              <button type="button" onClick={calculateFreight}>Calcular</button>
            </div>
            {freight && (
              <p className="freight-result">
                {freight.label}: {money(freight.price)} · {freight.deadline}
              </p>
            )}
          </div>

          <ul className="side-benefits">
            <li>
              <Truck size={26} />
              <span><strong>Frete Grátis</strong>Em compras acima de R$199,00</span>
            </li>
            <li>
              <Truck size={26} />
              <span><strong>Entrega Rápida</strong>Para todo o Brasil</span>
            </li>
            <li>
              <LockKeyhole size={26} />
              <span><strong>Devolução Grátis</strong>Até 7 dias após o recebimento</span>
            </li>
          </ul>
        </aside>
      </div>

      <section className="container product-tabs">
        <div className="tab-buttons">
          <button className={tab === "description" ? "active" : ""} type="button" onClick={() => setTab("description")}>
            Descrição
          </button>
          <button className={tab === "specs" ? "active" : ""} type="button" onClick={() => setTab("specs")}>
            Especificações
          </button>
          <button className={tab === "reviews" ? "active" : ""} type="button" onClick={() => setTab("reviews")}>
            Avaliações ({product.review_count})
          </button>
        </div>
        {tab === "description" && (
          <p>
            {product.description} Ideal para profissionais exigentes e para quem busca resultados superiores em casa ou no
            trabalho.
          </p>
        )}
        {tab === "specs" && (
          <ul>
            {product.specs.map((spec) => (
              <li key={spec}>{spec}</li>
            ))}
          </ul>
        )}
        {tab === "reviews" && <p>Produto avaliado com nota máxima por {product.review_count} clientes.</p>}
      </section>

      <section id="formas-pagamento" className="container payment-panel">
        <h2>Formas de pagamento aceitas</h2>
        <PaymentGrid />
      </section>
    </main>
  );
}
