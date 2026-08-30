import "dotenv/config";

import { sql } from "drizzle-orm";

import { db } from "./index";
import { products } from "./schema";

const seedProducts = [
  {
    id: "prod-normal",
    name: "Producto Normal",
    description: "Producto con stock suficiente y margen saludable.",
    precioVenta: 1500,
    costo: 900,
    stockReal: 100,
    stockComprometido: 10,
    stockMinimo: 20,
  },
  {
    id: "prod-critical",
    name: "Producto Crítico",
    description: "Stock por debajo del mínimo, pero todavía vendible.",
    precioVenta: 2200,
    costo: 1300,
    stockReal: 30,
    stockComprometido: 15,
    stockMinimo: 20,
  },
  {
    id: "prod-critical-low",
    name: "Producto Crítico - Pocas Unidades",
    description: "Stock crítico con pocas unidades disponibles.",
    precioVenta: 3500,
    costo: 2100,
    stockReal: 10,
    stockComprometido: 8,
    stockMinimo: 5,
  },
  {
    id: "prod-out",
    name: "Producto Sin Stock",
    description: "Producto sin unidades disponibles.",
    precioVenta: 1800,
    costo: 1000,
    stockReal: 5,
    stockComprometido: 5,
    stockMinimo: 2,
  },
  {
    id: "prod-committed",
    name: "Producto Alta Demanda",
    description: "Producto con una parte importante del stock comprometida.",
    precioVenta: 4800,
    costo: 3000,
    stockReal: 50,
    stockComprometido: 35,
    stockMinimo: 10,
  },
  {
    id: "prod-no-stock",
    name: "Producto Agotado",
    description: "Producto sin stock físico.",
    precioVenta: 1200,
    costo: 700,
    stockReal: 0,
    stockComprometido: 0,
    stockMinimo: 5,
  },
];

async function seed() {
  console.log("Starting database seed...");

  await db
    .insert(products)
    .values(seedProducts)
    .onConflictDoUpdate({
      target: products.id,
      set: {
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        precioVenta: sql`excluded.precio_venta`,
        costo: sql`excluded.costo`,
        stockReal: sql`excluded.stock_real`,
        stockComprometido: sql`excluded.stock_comprometido`,
        stockMinimo: sql`excluded.stock_minimo`,
        updatedAt: new Date(),
      },
    });

  console.log(`Seeded ${seedProducts.length} products.`);
}

seed()
  .catch((error) => {
    console.error("Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });