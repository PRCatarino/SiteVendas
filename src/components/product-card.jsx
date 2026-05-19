import Link from "next/link";
import { Star } from "lucide-react";
import { ProductImage } from "@/components/product-image";
import { money } from "@/lib/format";

export function ProductCard({ product }) {
  const href = `/produto/${product.slug}`;

  return (
    <article className="product-card">
      <Link className="product-card-image" href={href}>
        <ProductImage product={product} />
      </Link>
      <Link className="product-card-title" href={href}>
        {product.name}
      </Link>
      <div className="rating-row" aria-label={`${product.rating} estrelas, ${product.review_count} avaliações`}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} size={16} fill="#ff6b00" strokeWidth={0} aria-hidden="true" />
        ))}
        <span>({product.review_count})</span>
      </div>
      <strong className="product-price">{money(product.price)}</strong>
      <Link className="button button-primary" href={href}>
        Comprar
      </Link>
    </article>
  );
}
