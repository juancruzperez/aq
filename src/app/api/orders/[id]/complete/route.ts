import { NextResponse } from "next/server";

import {
  completeOrder,
  OrderNotFoundForCompleteError,
  OrderNotReadyForCompleteError,
} from "../../../../../modules/orders/complete";

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
    const result = await completeOrder(id);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof OrderNotFoundForCompleteError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 404,
        },
      );
    }

    if (error instanceof OrderNotReadyForCompleteError) {
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