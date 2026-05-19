import { AliExpressAdmin } from "@/components/aliexpress-admin";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { getDropAdminData } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AliExpressAdminPage() {
  const { products, orders } = await getDropAdminData();

  return (
    <>
      <Header />
      <AliExpressAdmin initialProducts={products} initialOrders={orders} />
      <Footer />
    </>
  );
}
