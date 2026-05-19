import { Suspense } from "react";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { RegisterForm } from "@/components/auth-forms";

export default function RegisterPage() {
  return (
    <>
      <Header />
      <main className="auth-page">
        <Suspense fallback={null}>
          <RegisterForm />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
