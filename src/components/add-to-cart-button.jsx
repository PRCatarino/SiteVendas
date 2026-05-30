"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useToast } from "@/components/toast";

export function BotaoAdicionarCarrinho({
  productId,
  quantity = 1,
  children = "Comprar",
  variant = "primary",
  redirectTo,
  onAdded,
}) {
  const [carregando, setCarregando] = useState(false);
  const { exibirToast } = useToast();
  const router = useRouter();

  async function adicionarAoCarrinho() {
    setCarregando(true);

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });

      if (!response.ok) {
        throw new Error("Não foi possível adicionar o produto.");
      }

      window.dispatchEvent(new Event("cart-updated"));
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        exibirToast("Produto adicionado ao carrinho.");
        onAdded?.();
      }
    } catch (error) {
      exibirToast(error.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <button
      className={`button button-${variant}`}
      type="button"
      onClick={adicionarAoCarrinho}
      disabled={carregando}
    >
      <ShoppingCart size={18} aria-hidden="true" />
      {carregando ? "Adicionando..." : children}
    </button>
  );
}
