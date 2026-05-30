import { NextResponse } from "next/server";
import { exigirAdminDaRequisicao } from "@/lib/auth";
import { importarProdutosPorLinks } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    await exigirAdminDaRequisicao(request);
    const body = await request.json();
    const produtos = await importarProdutosPorLinks({
      input: body.input || body.csv || body.links || "",
      markupPercent: Number(body.markupPercent || 40),
    });
    return NextResponse.json({ products: produtos }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 400 });
  }
}
