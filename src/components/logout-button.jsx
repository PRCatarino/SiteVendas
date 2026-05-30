"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useToast } from "@/components/toast";

export function BotaoSair() {
  const router = useRouter();
  const { exibirToast } = useToast();

  async function sair() {
    const response = await fetch("/api/auth/logout", { method: "POST" });

    if (!response.ok) {
      exibirToast("Nao foi possivel sair agora.");
      return;
    }

    window.dispatchEvent(new Event("auth-updated"));
    exibirToast("Voce saiu da conta.");
    router.push("/");
    router.refresh();
  }

  return (
    <button className="button button-dark account-logout" type="button" onClick={sair}>
      <LogOut size={18} />
      Sair da conta
    </button>
  );
}
