import Link from "next/link";
import { BarraBeneficios } from "@/components/benefit-bar";
import { FaixaCategorias } from "@/components/category-strip";
import { Rodape } from "@/components/footer";
import { Cabecalho } from "@/components/header";
import { CarrosselHome } from "@/components/home-carousel";
import { SecoesConfiancaHome } from "@/components/home-trust-sections";
import { CardProduto } from "@/components/product-card";
import { obterProdutos } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const todos = await obterProdutos();
  const busca = String(resolvedSearchParams?.q || "").trim().toLowerCase();
  const produtos = busca
    ? todos.filter((p) => p.name.toLowerCase().includes(busca) || (p.category || "").toLowerCase().includes(busca))
    : todos;

  return (
    <>
      <Cabecalho />
      <main>
        <CarrosselHome />
        <BarraBeneficios />
        <FaixaCategorias />

        <section className="products-section-new container">
          <div className="section-title" style={{ marginBottom: 16, marginTop: 8 }}>
            <h2>Produtos em Destaque</h2>
            <Link href="/produtos">Ver todos ›</Link>
          </div>
          <div className="product-grid">
            {produtos.slice(0, 8).map((produto) => (
              <CardProduto product={produto} key={produto.id} />
            ))}
          </div>
        </section>

        <SecoesConfiancaHome />
      </main>
      <Rodape />
    </>
  );
}
