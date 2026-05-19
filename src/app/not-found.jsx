import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="not-found container">
        <h1>Produto não encontrado</h1>
        <Link className="button button-primary" href="/">Voltar para a loja</Link>
      </main>
      <Footer />
    </>
  );
}
