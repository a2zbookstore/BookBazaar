import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";

export function getDatabaseUrl(): string {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev && process.env.DEV_DATABASE_URL) {
    console.log('[DB] Using DEV database');
    return process.env.DEV_DATABASE_URL;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  if (isDev && !process.env.DEV_DATABASE_URL) {
    console.warn('[DB] WARNING: DEV_DATABASE_URL not set — using PRODUCTION database in development!');
    console.warn('[DB] Set DEV_DATABASE_URL secret to use a separate dev database.');
  }

  return process.env.DATABASE_URL;
}

const sql = neon(getDatabaseUrl());
export const db = drizzle(sql, { schema });
