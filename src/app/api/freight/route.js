import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const body = await request.json();
  const cep = String(body.cep || "").replace(/\D/g, "");
  const subtotal = Number(body.subtotal || 0);

  if (cep.length !== 8) {
    return NextResponse.json({ error: "Digite um CEP válido com 8 números." }, { status: 400 });
  }

  const isFree = subtotal >= 199;

  return NextResponse.json({
    cep,
    price: isFree ? 0 : 24.9,
    label: isFree ? "Frete grátis" : "Entrega expressa",
    deadline: isFree ? "3 a 6 dias úteis" : "2 a 5 dias úteis",
    message: isFree
      ? "Frete grátis disponível para compras acima de R$199,00."
      : "Entrega rápida calculada para o CEP informado.",
  });
}
