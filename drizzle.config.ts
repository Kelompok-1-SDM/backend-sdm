import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export const dbCredentials = {
    host: process.env.DATABASE_HOST!,
    user: process.env.DATABASE_USERNAME!,
    password: process.env.DATABASE_PASSWORD || undefined,
    database: process.env.DATABASE_NAME!,
    waitForConnections: true,
    connectionLimit: 10, // Number of connections in the pool
};

export default defineConfig({
    out: './drizzle',
    schema: './src/db/schema.ts',
    dialect: 'mysql',
    dbCredentials,
    casing: 'snake_case'
});