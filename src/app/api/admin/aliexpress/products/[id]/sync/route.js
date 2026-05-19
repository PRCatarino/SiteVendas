import { NextResponse } from "next/server";
import { syncAliExpressProduct } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(_request, { params }) {
  const { id } = await params;

  try {
    const product = await syncAliExpressProduct(id);
    return NextResponse.json({ product });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
