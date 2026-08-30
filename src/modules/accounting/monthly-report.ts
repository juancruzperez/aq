import { getCosts } from "./costs";
import { getRevenue } from "./revenue";

export type MonthlyReportInput = {
  year: number;
  month: number;
};

export type MonthlyReport = {
  period: {
    year: number;
    month: number;
    from: Date;
    to: Date;
  };
  revenue: number;
  costs: number;
  grossProfit: number;
  grossMargin: number;
};

export async function getMonthlyReport({
  year,
  month,
}: MonthlyReportInput): Promise<MonthlyReport> {
  if (!Number.isInteger(year) || year < 1970) {
    throw new Error(`Año inválido: ${year}`);
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(`Mes inválido: ${month}`);
  }

  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 1));

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
    period: {
      year,
      month,
      from,
      to,
    },
    revenue,
    costs,
    grossProfit,
    grossMargin,
  };
}