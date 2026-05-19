import { NextResponse } from "next/server";
import { createManualAliExpressProduct, importAliExpressProduct } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const body = await request.json();

  if (!body.productInput) {
    return NextResponse.json({ error: "Informe o link ou ID do produto AliExpress." }, { status: 400 });
  }

  try {
    const product = body.manual
      ? await createManualAliExpressProduct({
          productInput: body.productInput,
          name: body.name,
          cost: body.cost,
          markupPercent: body.markupPercent,
          imageUrl: body.imageUrl,
        })
      : await importAliExpressProduct({
          productInput: body.productInput,
          markupPercent: body.markupPercent,
        });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
