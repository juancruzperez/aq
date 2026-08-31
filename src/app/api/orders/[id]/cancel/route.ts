import { NextResponse } from "next/server";

import {
  cancelOrder,
  OrderNotFoundError,
  OrderNotPendingError,
} from "../../../../../modules/orders/cancel";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  const { id } = await context.params;

  try {
    const result = await cancelOrder(id);

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

    if (error instanceof OrderNotPendingError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 409,
        },
      );
    }

    throw error;
  }
}