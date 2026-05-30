const beneficios = [
  { icon: "🚚", title: "Entrega Rapida", text: "Para todo o Brasil" },
  { icon: "🛡️", title: "Pagamento Seguro", text: "Ambiente 100% seguro" },
  { icon: "🏅", title: "Produtos Profissionais", text: "Qualidade testada e aprovada" },
  { icon: "🎧", title: "Suporte Especializado", text: "Atendimento tecnico dedicado" },
];

export function BarraBeneficios({ className = "" }) {
  return (
    <section className={`benefits container${className ? ` ${className}` : ""}`} aria-label="Beneficios da loja">
      {beneficios.map(({ icon, title, text }) => (
        <div key={title}>
          <span className="benefit-icon" aria-hidden="true">{icon}</span>
          <strong>{title}</strong>
          <small>{text}</small>
        </div>
      ))}
    </section>
  );
}
