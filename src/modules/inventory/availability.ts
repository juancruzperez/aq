export type StockAvailabilityInput = {
  stockReal: number;
  stockComprometido: number;
  stockMinimo: number;
  cantidadSolicitada?: number;
};

export type StockAvailability = {
  stockDisponible: number;
  puedeVender: boolean;
  esCritico: boolean;
  estaAgotado: boolean;
};

export function getStockAvailability({
  stockReal,
  stockComprometido,
  stockMinimo,
  cantidadSolicitada = 0,
}: StockAvailabilityInput): StockAvailability {
  const stockDisponible = stockReal - stockComprometido;

  const puedeVender =
    cantidadSolicitada > 0 && cantidadSolicitada <= stockDisponible;

  const esCritico = stockDisponible <= stockMinimo;

  const estaAgotado = stockDisponible <= 0;

  return {
    stockDisponible,
    puedeVender,
    esCritico,
    estaAgotado,
  };
}