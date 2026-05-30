import { NextResponse } from "next/server";
import { obterProdutos } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const produtos = await obterProdutos();
  return NextResponse.json({ products: produtos });
}
