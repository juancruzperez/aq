import { getCosts } from "./costs";
import { getRevenue } from "./revenue";

export type ProfitabilityPeriod = {
  from?: Date;
  to?: Date;
};

export type ProfitabilityResult = {
  revenue: number;
  costs: number;
  grossProfit: number;
  grossMargin: number;
};

export async function getProfitability({
  from,
  to,
}: ProfitabilityPeriod = {}): Promise<ProfitabilityResult> {
  const period = {
    from,
    to,
  };

  const [revenue, costs] = await Promise.all([
    getRevenue(period),
    getCosts(period),
  ]);

  const grossProfit = revenue - costs;

  const grossMargin =
    revenue > 0
      ? (grossProfit / revenue) * 100
      : 0;

  return {
    revenue,
    costs,
    grossProfit,
    grossMargin,
  };
}