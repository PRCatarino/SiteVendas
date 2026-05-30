"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  CheckCircle2,
  ChevronRight,
  LockKeyhole,
  Minus,
  Play,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Truck,
  X,
} from "lucide-react";
import { GradePagamentos } from "@/components/footer";
import { ImagemProduto } from "@/components/product-image";
import { useToast } from "@/components/toast";
import { formatarDinheiro, textoParcelas } from "@/lib/format";

export function CompraProduto({ product }) {
  const router = useRouter();
  const { exibirToast } = useToast();
  const [quantidade, setQuantidade] = useState(1);
  const [cep, setCep] = useState("");
  const [frete, setFrete] = useState(null);
  const [aba, setAba] = useState("description");
  const [carregando, setCarregando] = useState(false);
  const [zoomAberto, setZoomAberto] = useState(false);
  const galeria = product.gallery_images?.length ? product.gallery_images : [product.image_url];
  const videos = product.videos || [];
  const [imagemAtiva, setImagemAtiva] = useState(galeria[0]);
  const [videoAtivo, setVideoAtivo] = useState(null);

  function selecionarImagem(imagem) {
    setImagemAtiva(imagem);
    setVideoAtivo(null);
  }

  function selecionarVideo(video) {
    setVideoAtivo(video);
    setImagemAtiva(null);
  }

  function alterarQuantidade(passo) {
    setQuantidade((atual) => Math.max(1, atual + passo));
  }

  async function adicionarAoCarrinho(irParaCarrinho = false) {
    setCarregando(true);
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: quantidade }),
      });

      if (!response.ok) throw new Error("Não foi possível adicionar o produto.");
      window.dispatchEvent(new Event("cart-updated"));
      exibirToast("Produto adicionado ao carrinho.");
      if (irParaCarrinho) router.push("/carrinho");
    } catch (error) {
      exibirToast(error.message);
    } finally {
      setCarregando(false);
    }
  }

  async function calcularFrete() {
    const response = await fetch("/api/freight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cep, subtotal: product.price * quantidade }),
    });
    const data = await response.json();

    if (!response.ok) {
      exibirToast(data.error || "Não foi possível calcular o frete.");
      return;
    }

    setFrete(data);
    exibirToast(data.message);
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
          {!videoAtivo && (
            <button className="gallery-zoom" type="button" onClick={() => setZoomAberto(true)} aria-label="Ampliar imagem">
              <Search size={25} />
            </button>
          )}
          {videoAtivo ? (
            /youtube\.com\/embed\//i.test(videoAtivo.url) ? (
              <iframe
                className="gallery-video"
                src={videoAtivo.url}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title="Vídeo do produto"
              />
            ) : (
              <video
                className="gallery-video"
                src={videoAtivo.url}
                poster={videoAtivo.poster || undefined}
                controls
                autoPlay
                muted
                loop
                playsInline
              />
            )
          ) : (
            <ImagemProduto product={product} src={imagemAtiva} large />
          )}
          <div className="thumb-row">
            {galeria.map((imagem, indice) => (
              <button
                className={`thumb-button ${!videoAtivo && imagemAtiva === imagem ? "active" : ""}`}
                key={`${imagem}-${indice}`}
                type="button"
                onClick={() => selecionarImagem(imagem)}
                aria-label="Selecionar foto do produto"
              >
                {/^https?:\/\//i.test(imagem) ? <img src={imagem} alt="" /> : <Image src={imagem} alt="" width={160} height={120} />}
              </button>
            ))}
            {videos.map((video, indice) => (
              <button
                className={`thumb-button thumb-button-video ${videoAtivo === video ? "active" : ""}`}
                key={`video-${indice}`}
                type="button"
                onClick={() => selecionarVideo(video)}
                aria-label="Reproduzir vídeo do produto"
              >
                {video.poster ? (
                  <img src={video.poster} alt="" />
                ) : (
                  <span className="thumb-video-placeholder" />
                )}
                <span className="thumb-play-icon"><Play size={16} /></span>
              </button>
            ))}
          </div>
        </section>

        <section className="product-info">
          <small>SKU: {product.sku}</small>
          <h1>{product.name}</h1>
          <p>{product.brand}</p>
          <div className="product-rating">★★★★★ <span>({product.review_count} avaliações)</span></div>
          <strong className="product-page-price">{formatarDinheiro(product.price)}</strong>
          <p className="installments">{textoParcelas(product.price * quantidade, 6)}</p>
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
            <button type="button" onClick={() => alterarQuantidade(-1)} aria-label="Diminuir quantidade">
              <Minus size={16} />
            </button>
            <strong>{quantidade}</strong>
            <button type="button" onClick={() => alterarQuantidade(1)} aria-label="Aumentar quantidade">
              <Plus size={16} />
            </button>
          </div>

          <button className="button button-primary buy-now" type="button" onClick={() => adicionarAoCarrinho(true)} disabled={carregando}>
            Comprar agora <ChevronRight size={20} />
          </button>
          <button className="button button-dark" type="button" onClick={() => adicionarAoCarrinho(false)} disabled={carregando}>
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
              <button type="button" onClick={calcularFrete}>Calcular</button>
            </div>
            {frete && (
              <p className="freight-result">
                {frete.label}: {formatarDinheiro(frete.price)} · {frete.deadline}
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
          <button className={aba === "description" ? "active" : ""} type="button" onClick={() => setAba("description")}>
            Descrição
          </button>
          <button className={aba === "specs" ? "active" : ""} type="button" onClick={() => setAba("specs")}>
            Especificações
          </button>
          <button className={aba === "reviews" ? "active" : ""} type="button" onClick={() => setAba("reviews")}>
            Avaliações ({product.review_count})
          </button>
        </div>
        {aba === "description" && (
          <p>
            {product.description} Ideal para profissionais exigentes e para quem busca resultados superiores em casa ou no
            trabalho.
          </p>
        )}
        {aba === "specs" && (
          product.specs.length > 0 && typeof product.specs[0] === "object" ? (
            <table className="specs-table">
              <tbody>
                {product.specs.map((spec) => (
                  <tr key={`${spec.label}-${spec.value}`}>
                    <th>{spec.label}</th>
                    <td>{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <ul>
              {product.specs.map((spec) => (
                <li key={spec}>{spec}</li>
              ))}
            </ul>
          )
        )}
        {aba === "reviews" && <p>Produto avaliado com nota máxima por {product.review_count} clientes.</p>}
      </section>

      <section id="formas-pagamento" className="container payment-panel">
        <h2>Formas de pagamento aceitas</h2>
        <GradePagamentos />
      </section>

      {zoomAberto && (
        <div className="image-modal" role="dialog" aria-modal="true" aria-label="Imagem ampliada do produto">
          <button className="image-modal-close" type="button" onClick={() => setZoomAberto(false)} aria-label="Fechar imagem">
            <X size={28} />
          </button>
          <button className="image-modal-backdrop" type="button" onClick={() => setZoomAberto(false)} aria-label="Fechar imagem" />
          <div className="image-modal-content">
            {/^https?:\/\//i.test(imagemAtiva) ? (
              <img src={imagemAtiva} alt={product.name} />
            ) : (
              <Image src={imagemAtiva} alt={product.name} width={1000} height={760} />
            )}
          </div>
        </div>
      )}
    </main>
  );
}
