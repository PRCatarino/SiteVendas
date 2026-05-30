import Link from "next/link";
import { BotaoAdicionarCarrinho } from "@/components/add-to-cart-button";
import { ImagemProduto } from "@/components/product-image";
import { formatarDinheiro, textoParcelas } from "@/lib/format";

const etiquetas = {
  "drill-driver-21v": { texto: "Top venda", cor: "" },
  "impact-drill-650w": { texto: "Frete gratis", cor: "green" },
  "kit-tools-110": { texto: "Oferta", cor: "" },
  "kit-tools-150": { texto: "Frete gratis", cor: "green" },
  "socket-set-46": { texto: "Top venda", cor: "" },
  "laser-tape-40m": { texto: "Frete gratis", cor: "green" },
};

export function CardProduto({ product }) {
  const href = `/produto/${product.slug}`;
  const etiqueta = etiquetas[product.id];

  return (
    <article className="product-card">
      {etiqueta && (
        <span className={`product-badge ${etiqueta.cor || "orange"}`}>{etiqueta.texto}</span>
      )}

      <Link className="product-card-img-wrap" href={href} aria-label={product.name}>
        <ImagemProduto product={product} />
      </Link>

      <Link className="product-card-name" href={href}>
        {product.name}
      </Link>

      <div className="product-rating-row" aria-label={`${product.rating} estrelas`}>
        ★★★★★ <small>({product.review_count})</small>
      </div>

      <strong className="product-card-price">{formatarDinheiro(product.price)}</strong>
      <small className="product-card-installments">
        ou {textoParcelas(product.price, 12).replace("em ate ", "")}
      </small>
      <small className="product-card-pix">
        {formatarDinheiro(product.price * 0.95)} no PIX (5% OFF)
      </small>

      <div className="card-actions">
        <BotaoAdicionarCarrinho productId={product.id} redirectTo="/carrinho">Comprar agora</BotaoAdicionarCarrinho>
        <BotaoAdicionarCarrinho productId={product.id} variant="outline">Adicionar</BotaoAdicionarCarrinho>
      </div>
    </article>
  );
}
