import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Verificamos que la variable de entorno exista para evitar errores en producción
if (!process.env.DATABASE_URL) {
  throw new Error('Falta la variable de entorno DATABASE_URL');
}

// Inicializamos la conexión HTTP de Neon (ideal para Vercel/Serverless)
const sql = neon(process.env.DATABASE_URL);

// Exportamos la instancia 'db' junto con el esquema para hacer consultas
export const db = drizzle(sql, { schema });