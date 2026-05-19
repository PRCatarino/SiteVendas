import { Suspense } from "react";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { LoginForm } from "@/components/auth-forms";

export default function LoginPage() {
  return (
    <>
      <Header />
      <main className="auth-page">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
