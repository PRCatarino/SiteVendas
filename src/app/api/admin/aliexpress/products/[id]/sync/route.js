import { NextResponse } from "next/server";
import { exigirAdminDaRequisicao } from "@/lib/auth";
import { sincronizarProdutoAliExpress } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  try {
    await exigirAdminDaRequisicao(request);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 403 });
  }

  const { id } = await params;

  try {
    const produto = await sincronizarProdutoAliExpress(id);
    return NextResponse.json({ product: produto });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
