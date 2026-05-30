import { NextResponse } from "next/server";
import { exigirAdminDaRequisicao } from "@/lib/auth";
import { atualizarPublicacaoProduto } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  try {
    await exigirAdminDaRequisicao(request);
    const { id } = await params;
    const body = await request.json();
    const produto = await atualizarPublicacaoProduto(id, body.status);
    if (!produto) {
      return NextResponse.json({ error: "Produto nao encontrado." }, { status: 404 });
    }
    return NextResponse.json({ product: produto });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 400 });
  }
}
