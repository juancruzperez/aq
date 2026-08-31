import { NextResponse } from "next/server";

import {
  getProduct,
  ProductNotFoundError,
} from "../../../../modules/products/get";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  const { id } = await context.params;

  try {
    const product = await getProduct(id);

    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof ProductNotFoundError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 404,
        },
      );
    }

    throw error;
  }
}