import { NextResponse } from "next/server";
import { calculateCouponDiscount } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const body = await request.json();
  const subtotal = Number(body.subtotal || 0);
  const { coupon, discount } = await calculateCouponDiscount(body.code, subtotal);

  if (!coupon) {
    return NextResponse.json({ error: "Cupom inválido ou subtotal insuficiente.", discount: 0 }, { status: 404 });
  }

  return NextResponse.json({ coupon, discount });
}
