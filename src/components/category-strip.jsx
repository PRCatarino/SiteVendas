import Link from "next/link";

const categorias = [
  { label: "Furadeiras", href: "/produtos?categoria=Ferramentas%20Eletricas", icon: "🔩" },
  { label: "Jogos de Ferramentas", href: "/produtos?tipo=kits", icon: "🧰" },
  { label: "Soquetes e Catraca", href: "/produtos?categoria=Kits", icon: "⚙️" },
  { label: "Medicao", href: "/produtos?categoria=Medicao", icon: "📏" },
  { label: "Ferramentas Eletricas", href: "/produtos?categoria=Ferramentas%20Eletricas", icon: "🔧" },
  { label: "Acessorios", href: "/produtos?categoria=Acessorios", icon: "🏗️" },
];

export function FaixaCategorias() {
  return (
    <nav className="categories container" aria-label="Categorias principais">
      {categorias.map(({ label, href, icon }) => (
        <Link key={label} href={href}>
          <span aria-hidden="true">{icon}</span>
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
