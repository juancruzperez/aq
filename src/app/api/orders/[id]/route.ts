import { NextResponse } from "next/server";

import {
  getOrder,
  OrderNotFoundError,
} from "../../../../modules/orders/get";

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
    const result = await getOrder(id);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof OrderNotFoundError) {
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