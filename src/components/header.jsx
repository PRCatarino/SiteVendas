"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Phone, Search, ShoppingCart, Truck, UserRound } from "lucide-react";
import { Logo } from "@/components/logo";

const categories = ["Martelos", "Chaves", "Alicates", "Medição", "Kits", "Promoções", "Marcas", "Lançamentos"];

export function Header() {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [count, setCount] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadCount() {
      try {
        const response = await fetch("/api/cart", { cache: "no-store" });
        const data = await response.json();
        if (!ignore) setCount(data.cart?.count || 0);
      } catch {
        if (!ignore) setCount(0);
      }
    }

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await response.json();
        if (!ignore) setUser(data.user || null);
      } catch {
        if (!ignore) setUser(null);
      }
    }

    loadCount();
    loadUser();
    window.addEventListener("cart-updated", loadCount);
    window.addEventListener("auth-updated", loadUser);
    return () => {
      ignore = true;
      window.removeEventListener("cart-updated", loadCount);
      window.removeEventListener("auth-updated", loadUser);
    };
  }, []);

  function submitSearch(event) {
    event.preventDefault();
    const value = term.trim().toLowerCase();

    if (value.includes("furadeira") || value.includes("impacto") || value.includes("650")) {
      router.push("/produto/furadeira-de-impacto-650w");
      return;
    }

    router.push(`/?q=${encodeURIComponent(term.trim())}`);
  }

  return (
    <header className="site-header">
      <div className="top-line">
        <div className="container header-line-content">
          <span className="freight-note">
            <Truck size={16} aria-hidden="true" />
            <strong>Frete grátis</strong> para compras acima de <strong>R$199,00</strong>
          </span>
          <span className="header-help">
            <Phone size={15} aria-hidden="true" />
            Atendimento: (11) 99999-9999
            <span className="help-link">
              Ajuda <ChevronDown size={14} aria-hidden="true" />
            </span>
          </span>
        </div>
      </div>

      <div className="main-header">
        <div className="container header-grid">
          <Logo />

          <form className="search-box" onSubmit={submitSearch}>
            <input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              type="search"
              placeholder="O que você precisa hoje?"
              aria-label="Pesquisar produtos"
            />
            <button type="submit" aria-label="Pesquisar">
              <Search size={24} />
            </button>
          </form>

          <Link className="account-button" href={user ? "/minha-conta" : "/login"}>
            <UserRound size={42} aria-hidden="true" />
            <span>
              {user ? "Minha Conta" : "Minha Conta"}
              <strong>{user ? user.full_name.split(" ")[0] : "Entrar"}</strong>
            </span>
          </Link>

          <Link className="cart-button" href="/carrinho">
            <span className="cart-icon-wrap">
              <ShoppingCart size={42} aria-hidden="true" />
              <small>{count}</small>
            </span>
            <span>Carrinho</span>
          </Link>
        </div>
      </div>

      <nav className="category-nav" aria-label="Categorias principais">
        <div className="container nav-row">
          {categories.map((category) => (
            <Link
              key={category}
              href={category.includes("Lan") ? "/produto/furadeira-de-impacto-650w" : `/produtos?categoria=${encodeURIComponent(category)}`}
            >
              {category}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

