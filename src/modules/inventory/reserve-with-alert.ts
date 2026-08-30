import { db } from "../../db";
import { checkCriticalStock } from "./critical-alert";
import { reserveStock } from "./reserve";

export type ReserveWithAlertInput = {
  productId: string;
  quantity: number;
};

export async function reserveStockWithAlert({
  productId,
  quantity,
}: ReserveWithAlertInput) {
  return db.transaction(async (tx) => {
    const reservation = await reserveStock(tx, {
      productId,
      quantity,
    });

    const notification = await checkCriticalStock(tx, {
      productId,
    });

    return {
      reservation,
      notification,
    };
  });
}
