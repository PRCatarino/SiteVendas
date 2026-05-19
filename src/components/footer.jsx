import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import { Logo } from "@/components/logo";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <section className="footer-brand">
          <Logo />
          <p>Sua loja completa de ferramentas manuais com qualidade profissional e os melhores preços.</p>
          <div className="social-row" aria-label="Redes sociais">
            <Facebook size={20} />
            <Instagram size={20} />
            <Youtube size={20} />
            <Linkedin size={20} />
          </div>
        </section>

        <section>
          <h2>Institucional</h2>
          <a href="#">Sobre Nós</a>
          <a href="#">Política de Privacidade</a>
          <a href="#">Trocas e Devoluções</a>
          <a href="#">Termos de Uso</a>
        </section>

        <section>
          <h2>Atendimento</h2>
          <p>(11) 99999-9999</p>
          <p>contato@catarinoprimeferramentas.com.br</p>
          <p>Seg a Sex - 8h às 18h</p>
          <p>Sáb: 8h às 12h</p>
        </section>

        <section>
          <h2>Ajuda</h2>
          <a href="#">Como Comprar</a>
          <a href="#">Formas de Pagamento</a>
          <a href="#">Prazo de Entrega</a>
          <a href="#">Garantia</a>
        </section>

        <section>
          <h2>Formas de Pagamento</h2>
          <PaymentGrid />
        </section>
      </div>
      <p className="copyright">© 2024 Catarino Prime Ferramentas - Todos os direitos reservados.</p>
    </footer>
  );
}

export function PaymentGrid() {
  return (
    <div className="payment-grid" aria-label="Formas de pagamento aceitas">
      <span>VISA</span>
      <span>MC</span>
      <span>elo</span>
      <span>AMEX</span>
      <span>Boleto</span>
      <span>pix</span>
    </div>
  );
}
