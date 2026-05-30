import { Suspense } from "react";
import { Rodape } from "@/components/footer";
import { Cabecalho } from "@/components/header";
import { FormularioLogin } from "@/components/auth-forms";

export default function PaginaLogin() {
  return (
    <>
      <Cabecalho />
      <main className="auth-page">
        <Suspense fallback={null}>
          <FormularioLogin />
        </Suspense>
      </main>
      <Rodape />
    </>
  );
}
