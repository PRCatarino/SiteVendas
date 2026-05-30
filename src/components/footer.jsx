import Link from "next/link";

export function GradePagamentos() {
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

export function Rodape() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <strong>CATARINO <em>PRIME</em></strong>
          <p>Ferramentas profissionais para quem exige desempenho, seguranca e durabilidade.</p>
        </div>
        <div>
          <strong>Pagamento 100% seguro</strong>
          <p>Visa • Mastercard • Pix • Boleto • SSL 256 bits</p>
          <p style={{ marginTop: 12 }}>
            <Link href="/info/politica-de-privacidade">Politica de Privacidade</Link>
            {" · "}
            <Link href="/info/trocas-e-devolucoes">Trocas e Devolucoes</Link>
          </p>
        </div>
        <div>
          <strong>Atendimento</strong>
          <p>
            <a href="tel:+5511999999999">(11) 99999-9999</a><br />
            Segunda a sexta, 08h as 18h
          </p>
        </div>
      </div>
      <p className="copyright">(c) 2024 Catarino Prime Ferramentas - Todos os direitos reservados.</p>
    </footer>
  );
}
