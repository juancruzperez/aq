import { NextResponse } from "next/server";

import {
  createOrder,
  DuplicateProductError,
  EmptyOrderError,
  InvalidOrderQuantityError,
  OrderProductNotFoundError,
} from "../../../modules/orders/create";
import { listOrders } from "../../../modules/orders/list";

type CreateOrderBody = {
  userId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
};

const VALID_STATUSES = [
  "PENDING",
  "READY_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
] as const;

export async function GET(request: Request) {
  const url = new URL(request.url);

  const userId = url.searchParams.get("userId") ?? undefined;
  const statusParam = url.searchParams.get("status") ?? undefined;
  const limitParam = url.searchParams.get("limit");
  const offsetParam = url.searchParams.get("offset");

  if (
    statusParam !== undefined &&
    !VALID_STATUSES.includes(
      statusParam as (typeof VALID_STATUSES)[number],
    )
  ) {
    return NextResponse.json(
      {
        error: `Estado inválido: ${statusParam}`,
      },
      {
        status: 400,
      },
    );
  }

  const limit = limitParam === null ? undefined : Number(limitParam);
  const offset = offsetParam === null ? undefined : Number(offsetParam);

  if (
    limit !== undefined &&
    (!Number.isInteger(limit) || limit < 1)
  ) {
    return NextResponse.json(
      {
        error: "limit debe ser un entero mayor que 0.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    offset !== undefined &&
    (!Number.isInteger(offset) || offset < 0)
  ) {
    return NextResponse.json(
      {
        error: "offset debe ser un entero mayor o igual a 0.",
      },
      {
        status: 400,
      },
    );
  }

  const orders = await listOrders({
    userId,
    status: statusParam as
      | "PENDING"
      | "READY_FOR_DELIVERY"
      | "COMPLETED"
      | "CANCELLED"
      | undefined,
    limit,
    offset,
  });

  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  let body: CreateOrderBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "El cuerpo de la solicitud debe ser JSON válido.",
      },
      {
        status: 400,
      },
    );
  }

  if (
    typeof body?.userId !== "string" ||
    body.userId.trim().length === 0
  ) {
    return NextResponse.json(
      {
        error: "userId es obligatorio.",
      },
      {
        status: 400,
      },
    );
  }

  if (!Array.isArray(body.items)) {
    return NextResponse.json(
      {
        error: "items debe ser un arreglo.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const result = await createOrder({
      userId: body.userId,
      items: body.items,
    });

    return NextResponse.json(result, {
      status: 201,
    });
  } catch (error) {
    if (
      error instanceof EmptyOrderError ||
      error instanceof DuplicateProductError ||
      error instanceof InvalidOrderQuantityError
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 400,
        },
      );
    }

    if (error instanceof OrderProductNotFoundError) {
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