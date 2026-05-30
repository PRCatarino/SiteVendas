"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const categoriasBusca = [
  ["", "Todas as categorias"],
  ["Ferramentas Eletricas", "Ferramentas Eletricas"],
  ["Kits", "Kits"],
  ["Chaves", "Chaves"],
  ["Medicao", "Medicao"],
  ["Alicates", "Alicates"],
  ["Solda", "Solda"],
  ["Acessorios", "Acessorios"],
];

export function Cabecalho() {
  const router = useRouter();
  const [termo, setTermo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [contagem, setContagem] = useState(0);
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    let ignorar = false;

    async function carregarContagem() {
      try {
        const response = await fetch("/api/cart", { cache: "no-store" });
        const data = await response.json();
        if (!ignorar) setContagem(data.cart?.count || 0);
      } catch {
        if (!ignorar) setContagem(0);
      }
    }

    async function carregarUsuario() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await response.json();
        if (!ignorar) setUsuario(data.user || null);
      } catch {
        if (!ignorar) setUsuario(null);
      }
    }

    carregarContagem();
    carregarUsuario();
    window.addEventListener("cart-updated", carregarContagem);
    window.addEventListener("auth-updated", carregarUsuario);
    return () => {
      ignorar = true;
      window.removeEventListener("cart-updated", carregarContagem);
      window.removeEventListener("auth-updated", carregarUsuario);
    };
  }, []);

  function enviarBusca(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (termo.trim()) params.set("q", termo.trim());
    if (categoria) params.set("categoria", categoria);
    router.push(params.toString() ? `/produtos?${params.toString()}` : "/produtos");
  }

  return (
    <>
      <div className="topbar">
        <div className="container topbar-grid">
          <span>🚚 <b>Frete gratis</b> para compras acima de <b>R$199,00</b></span>
          <span>☎ Atendimento: (11) 99999-9999</span>
          <span>🔒 Site 100% seguro</span>
        </div>
      </div>

      <header className="header">
        <div className="container header-grid">
          <Link className="logo" href="/">
            <span className="logo-mark">C</span>
            <span>
              <strong>CATARINO <em>PRIME</em></strong>
              <small>FERRAMENTAS</small>
            </span>
          </Link>

          <form className="search" onSubmit={enviarBusca}>
            <input
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              type="search"
              placeholder="O que voce precisa hoje?"
              aria-label="Pesquisar produtos"
            />
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              aria-label="Categoria da busca"
            >
              {categoriasBusca.map(([valor, rotulo]) => (
                <option key={rotulo} value={valor}>{rotulo}</option>
              ))}
            </select>
            <button type="submit">Buscar</button>
          </form>

          <div className="header-actions">
            <Link className="account-link" href={usuario ? "/minha-conta" : "/login"}>
              Minha Conta<br /><strong>{usuario ? usuario.full_name.split(" ")[0] : "Entrar"}</strong>
            </Link>
            <Link className="cart-link" href="/carrinho">
              🛒 <span className="cart-count">{contagem}</span>
              <br /><strong>Carrinho</strong>
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
