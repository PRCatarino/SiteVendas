import Link from "next/link";
import { notFound } from "next/navigation";
import { Rodape } from "@/components/footer";
import { Cabecalho } from "@/components/header";

const paginas = {
  "sobre-nos": {
    title: "Sobre Nos",
    lead: "A Catarino Prime Ferramentas nasceu para vender ferramentas praticas, bem apresentadas e com atendimento direto.",
    blocks: [
      "Trabalhamos com catalogo revisado, fotos locais e produtos separados por categorias para facilitar a compra.",
      "Nosso foco e entregar uma experiencia simples: escolher, colocar no carrinho, fechar pedido e acompanhar o atendimento.",
    ],
  },
  "politica-de-privacidade": {
    title: "Politica de Privacidade",
    lead: "Coletamos apenas os dados necessarios para cadastro, compra, entrega, suporte e seguranca da loja.",
    blocks: [
      "Dados como nome, email, telefone e endereco sao usados para processar pedidos e atendimento.",
      "Pagamentos sao processados por ambiente seguro. A loja nao exibe dados sensiveis de cartao.",
    ],
  },
  "trocas-e-devolucoes": {
    title: "Trocas e Devolucoes",
    lead: "Voce pode solicitar atendimento para troca ou devolucao conforme o prazo informado na compra.",
    blocks: [
      "Entre em contato pelo WhatsApp ou email com o numero do pedido, motivo e fotos do produto quando necessario.",
      "Apos analise, informamos as proximas etapas para troca, devolucao ou reembolso.",
    ],
  },
  "termos-de-uso": {
    title: "Termos de Uso",
    lead: "Ao usar o site, voce concorda com as regras de compra, cadastro, pagamento e atendimento da Catarino Prime.",
    blocks: [
      "Precos, disponibilidade e prazos podem mudar conforme estoque, fornecedor e regiao de entrega.",
      "Pedidos com dados incompletos ou inconsistentes podem precisar de confirmacao antes do envio.",
    ],
  },
  "como-comprar": {
    title: "Como Comprar",
    lead: "Escolha o produto, clique em Comprar, revise seu carrinho e finalize com seus dados de entrega.",
    blocks: [
      "Use a busca ou as categorias para encontrar ferramentas, kits, medicao, solda e acessorios.",
      "No carrinho voce pode alterar quantidade, calcular frete, aplicar cupom e concluir o pedido.",
    ],
  },
  "formas-de-pagamento": {
    title: "Formas de Pagamento",
    lead: "Aceitamos Pix, boleto e cartoes, conforme as opcoes liberadas no checkout.",
    blocks: [
      "Compras no Pix podem ter desconto promocional quando indicado no produto ou carrinho.",
      "Parcelamento e aprovacao dependem das regras do provedor de pagamento usado na finalizacao.",
    ],
  },
  "prazo-de-entrega": {
    title: "Prazo de Entrega",
    lead: "O prazo depende do CEP, modalidade de frete e disponibilidade do produto.",
    blocks: [
      "Use o calculador de frete na pagina do produto ou no carrinho para ver a estimativa.",
      "Depois do pedido, o atendimento informa atualizacoes importantes sobre separacao e envio.",
    ],
  },
  garantia: {
    title: "Garantia",
    lead: "Produtos com defeito devem ser informados ao atendimento para avaliacao e orientacao.",
    blocks: [
      "Guarde numero do pedido, embalagem e registros do problema para agilizar o suporte.",
      "A garantia segue as condicoes do produto, fornecedor e regras aplicaveis ao caso.",
    ],
  },
  seguranca: {
    title: "Site 100% Seguro",
    lead: "A loja usa conexao segura, checkout protegido e boas praticas para reduzir risco na compra.",
    blocks: [
      "Nunca solicitamos senha ou dados sensiveis fora do fluxo oficial do site.",
      "Em caso de duvida, fale pelo atendimento informado no topo da loja antes de finalizar.",
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(paginas).map((slug) => ({ slug }));
}

export default async function PaginaInfo({ params }) {
  const { slug } = await params;
  const pagina = paginas[slug];

  if (!pagina) notFound();

  return (
    <>
      <Cabecalho />
      <main className="info-page">
        <div className="container">
          <Link className="info-back" href="/">
            Voltar para a loja
          </Link>
          <article className="info-card">
            <h1>{pagina.title}</h1>
            <p className="info-lead">{pagina.lead}</p>
            {pagina.blocks.map((bloco) => (
              <p key={bloco}>{bloco}</p>
            ))}
            <div className="info-actions">
              <Link className="button button-primary" href="/produtos">
                Ver produtos
              </Link>
              <a className="button button-dark" href="https://wa.me/5511999999999" target="_blank" rel="noreferrer">
                Falar no WhatsApp
              </a>
            </div>
          </article>
        </div>
      </main>
      <Rodape />
    </>
  );
}
