import { NextResponse } from "next/server";

import { listProducts } from "../../../modules/products/list";

export async function GET() {
  const products = await listProducts();

  return NextResponse.json(products);
}