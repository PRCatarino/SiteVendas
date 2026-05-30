import { NextResponse } from "next/server";
import { calcularDescontoCupom } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const body = await request.json();
  const subtotal = Number(body.subtotal || 0);
  const { coupon: cupom, discount: desconto } = await calcularDescontoCupom(body.code, subtotal);

  if (!cupom) {
    return NextResponse.json({ error: "Cupom inválido ou subtotal insuficiente.", discount: 0 }, { status: 404 });
  }

  return NextResponse.json({ coupon: cupom, discount: desconto });
}
