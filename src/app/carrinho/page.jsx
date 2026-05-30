import { ClienteCarrinho } from "@/components/cart-client";
import { Rodape } from "@/components/footer";
import { Cabecalho } from "@/components/header";

export default function PaginaCarrinho() {
  return (
    <>
      <Cabecalho />
      <ClienteCarrinho />
      <Rodape />
    </>
  );
}
