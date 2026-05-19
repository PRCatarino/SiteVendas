"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useToast } from "@/components/toast";

export function AddToCartButton({ productId, quantity = 1, children = "Comprar", variant = "primary", onAdded }) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function addToCart() {
    setLoading(true);

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
      showToast("Produto adicionado ao carrinho.");
      onAdded?.();
    } catch (error) {
      showToast(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button className={`button button-${variant}`} type="button" onClick={addToCart} disabled={loading}>
      <ShoppingCart size={18} aria-hidden="true" />
      {loading ? "Adicionando" : children}
    </button>
  );
}
