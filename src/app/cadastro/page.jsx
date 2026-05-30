import { Suspense } from "react";
import { Rodape } from "@/components/footer";
import { Cabecalho } from "@/components/header";
import { FormularioCadastro } from "@/components/auth-forms";

export default function PaginaCadastro() {
  return (
    <>
      <Cabecalho />
      <main className="auth-page">
        <Suspense fallback={null}>
          <FormularioCadastro />
        </Suspense>
      </main>
      <Rodape />
    </>
  );
}
