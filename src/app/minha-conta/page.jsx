import { redirect } from "next/navigation";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { getCurrentUser, getOrdersForUser } from "@/lib/auth";
import { money } from "@/lib/format";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/minha-conta");

  const orders = await getOrdersForUser(user.id);
  const address = user.address;

  return (
    <>
      <Header />
      <main className="account-page container">
        <section className="account-card">
          <h1>Minha Conta</h1>
          <p><strong>Nome:</strong> {user.full_name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Telefone:</strong> {user.phone}</p>
        </section>
        <section className="account-card">
          <h2>Endereço de entrega</h2>
          {address ? (
            <p>{address.street}, {address.number}{address.complement ? ` - ${address.complement}` : ""} · {address.neighborhood} · {address.city}/{address.state} · CEP {address.cep}</p>
          ) : (
            <p>Nenhum endereço cadastrado.</p>
          )}
        </section>
        <section className="account-card">
          <h2>Pedidos</h2>
          {orders.length ? orders.map((order) => (
            <article className="order-row" key={order.id}>
              <span>{order.id}</span>
              <strong>{money(order.total)}</strong>
              <small>{order.status}</small>
            </article>
          )) : <p>Nenhum pedido encontrado.</p>}
        </section>
      </main>
      <Footer />
    </>
  );
}
