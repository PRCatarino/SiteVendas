import Link from "next/link";
import { Rodape } from "@/components/footer";
import { Cabecalho } from "@/components/header";
import { CardProduto } from "@/components/product-card";
import { obterProdutos } from "@/lib/store";

const categorias = ["Ferramentas Eletricas", "Kits", "Chaves", "Medicao", "Alicates", "Solda", "Acessorios"];

export const dynamic = "force-dynamic";

export default async function PaginaProdutos({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const tipo = String(resolvedSearchParams?.tipo || "");
  const categoria = String(resolvedSearchParams?.categoria || "");
  const busca = String(resolvedSearchParams?.q || "").trim().toLowerCase();
  const ofertas = String(resolvedSearchParams?.ofertas || "") === "true";
  const produtos = await obterProdutos();

  const filtrados = produtos.filter((produto) => {
    const cat = (produto.category || "").toLowerCase();
    if (tipo === "kits") return produto.is_kit || cat === "kits";
    if (categoria && cat !== categoria.toLowerCase()) return false;
    if (busca && !`${produto.name} ${cat} ${produto.description}`.toLowerCase().includes(busca)) return false;
    if (ofertas && Number(produto.price) > 199.9) return false;
    return true;
  });

  const titulo = ofertas ? "Ofertas da Semana" : tipo === "kits" ? "Kits Profissionais" : categoria ? categoria : busca ? `Busca: ${busca}` : "Todos os Produtos";

  return (
    <>
      <Cabecalho />
      <main className="container listing-page">
        <nav className="listing-filters" aria-label="Filtros de produtos">
          <Link className={!tipo && !categoria ? "active" : ""} href="/produtos">Todos</Link>
          {categorias.map((entrada) => (
            <Link
              key={entrada}
              className={(entrada === "Kits" ? tipo === "kits" : categoria === entrada) ? "active" : ""}
              href={entrada === "Kits" ? "/produtos?tipo=kits" : `/produtos?categoria=${encodeURIComponent(entrada)}`}
            >
              {entrada}
            </Link>
          ))}
        </nav>
        <div className="section-title">
          <h1>{titulo}</h1>
          <span>{filtrados.length} produtos</span>
        </div>
        {filtrados.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum produto encontrado.</p>
            <Link href="/produtos">Ver todos os produtos</Link>
          </div>
        ) : (
          <div className="product-grid listing-grid">
            {filtrados.map((produto) => (
              <CardProduto product={produto} key={produto.id} />
            ))}
          </div>
        )}
      </main>
      <Rodape />
    </>
  );
}
