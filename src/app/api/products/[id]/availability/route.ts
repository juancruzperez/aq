import { NextResponse } from "next/server";

import {
  getProduct,
  ProductNotFoundError,
} from "../../../../../modules/products/get";
import { getStockAvailability } from "../../../../../modules/inventory/availability";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext,
) {
  const { id } = await context.params;

  try {
    const product = await getProduct(id);

    const url = new URL(request.url);
    const cantidadParam = url.searchParams.get("cantidad");

    let cantidadSolicitada = 0;

    if (cantidadParam !== null) {
      const parsed = Number(cantidadParam);

      if (
        !Number.isInteger(parsed) ||
        parsed < 1
      ) {
        return NextResponse.json(
          {
            error:
              "El parámetro cantidad debe ser un entero mayor que 0.",
          },
          {
            status: 400,
          },
        );
      }

      cantidadSolicitada = parsed;
    }

    const availability = getStockAvailability({
      stockReal: product.stockReal,
      stockComprometido: product.stockComprometido,
      stockMinimo: product.stockMinimo,
      cantidadSolicitada,
    });

    return NextResponse.json({
      productId: product.id,
      productName: product.name,
      ...availability,
    });
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