import { Suspense } from "react";
import { AdminAliExpress } from "@/components/aliexpress-admin";
import { Rodape } from "@/components/footer";
import { Cabecalho } from "@/components/header";
import { obterUsuarioAtual } from "@/lib/auth";
import { obterDadosAdminDrop } from "@/lib/store";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PaginaAdminAliExpress() {
  const usuario = await obterUsuarioAtual();
  if (!usuario?.is_admin) redirect("/login?next=/admin/aliexpress");

  const { products, orders } = await obterDadosAdminDrop();

  return (
    <>
      <Cabecalho />
      <Suspense>
        <AdminAliExpress initialProducts={products} initialOrders={orders} />
      </Suspense>
      <Rodape />
    </>
  );
}
