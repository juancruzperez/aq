import { NextResponse } from "next/server";

import {
  markOrderReady,
  OrderNotFoundForReadyError,
  OrderNotPendingForReadyError,
} from "../../../../../modules/orders/ready";

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
    const order = await markOrderReady(id);

    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof OrderNotFoundForReadyError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 404,
        },
      );
    }

    if (error instanceof OrderNotPendingForReadyError) {
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