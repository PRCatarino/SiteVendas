import Link from "next/link";
import { Cabecalho } from "@/components/header";
import { Rodape } from "@/components/footer";

export default function NaoEncontrado() {
  return (
    <>
      <Cabecalho />
      <main className="not-found container">
        <h1>Produto não encontrado</h1>
        <Link className="button button-primary" href="/">Voltar para a loja</Link>
      </main>
      <Rodape />
    </>
  );
}
