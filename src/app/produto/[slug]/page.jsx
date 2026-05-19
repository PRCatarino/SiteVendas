import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ProductPurchase } from "@/components/product-purchase";
import { getProductBySlug, getProducts } from "@/lib/store";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <>
      <Header />
      <ProductPurchase product={product} />
      <Footer />
    </>
  );
}
