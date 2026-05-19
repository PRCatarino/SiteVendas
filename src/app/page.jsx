import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BenefitBar } from "@/components/benefit-bar";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { HomeCarousel } from "@/components/home-carousel";
import { KitStrip } from "@/components/kit-strip";
import { ProductCard } from "@/components/product-card";
import { getFeaturedProducts, getKitProducts } from "@/lib/store";

export default async function Home({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const [featured, kits] = await Promise.all([getFeaturedProducts(), getKitProducts()]);
  const search = String(resolvedSearchParams?.q || "").trim().toLowerCase();
  const products = search
    ? featured.filter((product) => product.name.toLowerCase().includes(search) || product.category.toLowerCase().includes(search))
    : featured;

  return (
    <>
      <Header />
      <main>
        <HomeCarousel />

        <BenefitBar className="home-benefits" />

        <section className="container products-section">
          <div className="section-title">
            <h2>Produtos em Destaque</h2>
            <Link href="/produtos">
              Ver todos <ChevronRight size={18} />
            </Link>
          </div>
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>
        </section>

        <KitStrip kits={kits} />
      </main>
      <Footer />
    </>
  );
}
