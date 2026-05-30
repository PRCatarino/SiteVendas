import { NextResponse } from "next/server";
import { exigirAdminDaRequisicao } from "@/lib/auth";
import { atualizarPrecoProduto, atualizarVideosProduto, removerProduto } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  try {
    await exigirAdminDaRequisicao(request);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 403 });
  }

  const { id } = await params;
  const body = await request.json();

  try {
    if (body.videos !== undefined) {
      const produto = await atualizarVideosProduto(id, body.videos);
      return NextResponse.json({ product: produto });
    }
    const produto = await atualizarPrecoProduto(id, {
      supplierCost: Number(body.supplierCost || 0),
      markupPercent: Number(body.markupPercent ?? 40),
    });
    return NextResponse.json({ product: produto });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await exigirAdminDaRequisicao(request);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 403 });
  }

  const { id } = await params;
  try {
    await removerProduto(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
