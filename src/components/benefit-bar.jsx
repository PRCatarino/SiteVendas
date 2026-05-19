import { Award, Headphones, ShieldCheck, Truck } from "lucide-react";

const benefits = [
  {
    icon: Truck,
    title: "Entrega Rápida",
    text: "Para todo o Brasil",
  },
  {
    icon: ShieldCheck,
    title: "Pagamento Seguro",
    text: "Ambiente 100% seguro",
  },
  {
    icon: Award,
    title: "Produtos Profissionais",
    text: "Qualidade testada e aprovada",
  },
  {
    icon: Headphones,
    title: "Suporte Especializado",
    text: "Atendimento técnico dedicado",
  },
];

export function BenefitBar({ className = "" }) {
  return (
    <section className={`benefit-bar ${className}`} aria-label="Benefícios da loja">
      <div className="container benefit-grid">
        {benefits.map(({ icon: Icon, title, text }) => (
          <div className="benefit-item" key={title}>
            <Icon size={42} aria-hidden="true" />
            <span>
              <strong>{title}</strong>
              <small>{text}</small>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
