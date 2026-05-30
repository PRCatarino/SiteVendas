import { notFound } from "next/navigation";
import { Rodape } from "@/components/footer";
import { Cabecalho } from "@/components/header";
import { CompraProduto } from "@/components/product-purchase";
import { obterProdutoPorSlug, obterProdutos } from "@/lib/store";

export async function generateStaticParams() {
  const produtos = await obterProdutos();
  return produtos.map((produto) => ({ slug: produto.slug }));
}

export default async function PaginaProduto({ params }) {
  const { slug } = await params;
  const produto = await obterProdutoPorSlug(slug);

  if (!produto) {
    notFound();
  }

  return (
    <>
      <Cabecalho />
      <CompraProduto product={produto} />
      <Rodape />
    </>
  );
}
