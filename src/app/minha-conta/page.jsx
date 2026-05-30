import Link from "next/link";
import { redirect } from "next/navigation";
import { Rodape } from "@/components/footer";
import { Cabecalho } from "@/components/header";
import { BotaoSair } from "@/components/logout-button";
import { obterUsuarioAtual, obterPedidosDoUsuario } from "@/lib/auth";
import { formatarDinheiro } from "@/lib/format";

export default async function PaginaConta() {
  const usuario = await obterUsuarioAtual();
  if (!usuario) redirect("/login?next=/minha-conta");

  const pedidos = await obterPedidosDoUsuario(usuario.id);
  const endereco = usuario.address;

  return (
    <>
      <Cabecalho />
      <main className="account-page container">
        {usuario.is_admin && (
          <section className="account-card admin-banner">
            <span className="admin-badge">⚙ Administrador</span>
            <h2>Painel Admin</h2>
            <p>Gerencie produtos, importe do AliExpress e acompanhe pedidos.</p>
            <Link href="/admin/aliexpress" className="button button-primary">
              Abrir Painel de Produtos
            </Link>
          </section>
        )}
        <section className="account-card">
          <h1>Minha Conta</h1>
          <p><strong>Nome:</strong> {usuario.full_name}</p>
          <p><strong>Email:</strong> {usuario.email}</p>
          <p><strong>Telefone:</strong> {usuario.phone}</p>
          <BotaoSair />
        </section>
        <section className="account-card">
          <h2>Endereço de entrega</h2>
          {endereco ? (
            <p>{endereco.street}, {endereco.number}{endereco.complement ? ` - ${endereco.complement}` : ""} · {endereco.neighborhood} · {endereco.city}/{endereco.state} · CEP {endereco.cep}</p>
          ) : (
            <p>Nenhum endereço cadastrado.</p>
          )}
        </section>
        <section className="account-card">
          <h2>Pedidos</h2>
          {pedidos.length ? pedidos.map((pedido) => (
            <article className="order-row" key={pedido.id}>
              <span>{pedido.id}</span>
              <strong>{formatarDinheiro(pedido.total)}</strong>
              <small>{pedido.status}</small>
            </article>
          )) : <p>Nenhum pedido encontrado.</p>}
        </section>
      </main>
      <Rodape />
    </>
  );
}
