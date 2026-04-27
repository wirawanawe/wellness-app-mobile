import mysql from 'mysql2/promise';

const globalForDb = global as unknown as { dbPool: mysql.Pool };

function createPool(): mysql.Pool {
  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wellness_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
  });
}

export const db: mysql.Pool =
  globalForDb.dbPool ?? (globalForDb.dbPool = createPool());

export async function query<T = unknown>(sql: string, params?: any[]): Promise<T[]> {
  const [rows] = await db.execute(sql, params);
  return rows as T[];
}

export async function queryOne<T = unknown>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(sql: string, params?: any[]): Promise<mysql.ResultSetHeader> {
  const [result] = await db.execute(sql, params);
  return result as mysql.ResultSetHeader;
}
