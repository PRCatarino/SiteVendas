import { NextResponse } from "next/server";
import { exigirAdminDaRequisicao } from "@/lib/auth";
import { criarProdutoAliExpressManual, importarProdutoAliExpress } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    await exigirAdminDaRequisicao(request);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 403 });
  }

  const body = await request.json();

  if (!body.productInput) {
    return NextResponse.json({ error: "Informe o link ou ID do produto AliExpress." }, { status: 400 });
  }

  try {
    const produto = body.manual
      ? await criarProdutoAliExpressManual({
          productInput: body.productInput,
          name: body.name,
          cost: body.cost,
          markupPercent: body.markupPercent,
          imageUrl: body.imageUrl,
          images: Array.isArray(body.images) ? body.images : [],
          description: body.description || "",
          category: body.category || "AliExpress",
          videoUrl: body.videoUrl || "",
        })
      : await importarProdutoAliExpress({
          productInput: body.productInput,
          markupPercent: body.markupPercent,
        });

    return NextResponse.json({ product: produto }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
