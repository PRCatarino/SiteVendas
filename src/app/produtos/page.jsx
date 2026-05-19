import Link from "next/link";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ProductCard } from "@/components/product-card";
import { getProducts } from "@/lib/store";

export default async function ProductsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const type = String(resolvedSearchParams?.tipo || "");
  const category = String(resolvedSearchParams?.categoria || "");
  const products = await getProducts();

  const filtered = products.filter((product) => {
    if (type === "kits") return product.is_kit || product.category.toLowerCase() === "kits";
    if (category) return product.category.toLowerCase() === category.toLowerCase();
    return true;
  });

  const title = type === "kits" ? "Kits Profissionais" : category ? category : "Todos os Produtos";

  return (
    <>
      <Header />
      <main className="container listing-page">
        <nav className="listing-filters" aria-label="Filtros de produtos">
          <Link className={!type && !category ? "active" : ""} href="/produtos">Todos</Link>
          <Link className={category === "Martelos" ? "active" : ""} href="/produtos?categoria=Martelos">Martelos</Link>
          <Link className={category === "Chaves" ? "active" : ""} href="/produtos?categoria=Chaves">Chaves</Link>
          <Link className={category === "Alicates" ? "active" : ""} href="/produtos?categoria=Alicates">Alicates</Link>
          <Link className={category === "Medição" ? "active" : ""} href="/produtos?categoria=Medição">Medição</Link>
          <Link className={type === "kits" ? "active" : ""} href="/produtos?tipo=kits">Kits</Link>
        </nav>
        <div className="section-title">
          <h1>{title}</h1>
          <span>{filtered.length} produtos</span>
        </div>
        <div className="products-grid listing-grid">
          {filtered.map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
