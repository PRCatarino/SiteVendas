import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { BotaoAdicionarCarrinho } from "@/components/add-to-cart-button";
import { ImagemProduto } from "@/components/product-image";
import { formatarDinheiro } from "@/lib/format";

export function FaixaKits({ kits }) {
  return (
    <section className="kit-section">
      <div className="container">
        <div className="section-title section-title-on-dark">
          <h2>Mais Vendidos | Kits Profissionais</h2>
          <Link href="/produtos?tipo=kits">
            Ver todos os kits <ChevronRight size={18} />
          </Link>
        </div>
        <div className="kit-grid">
          {kits.map((kit) => (
            <article className="kit-card" key={kit.id}>
              <ImagemProduto product={kit} className="kit-image" />
              <div>
                <h3>{kit.name}</h3>
                <p>{kit.description}</p>
                <strong>{formatarDinheiro(kit.price)}</strong>
                <BotaoAdicionarCarrinho productId={kit.id} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
