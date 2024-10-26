import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export const dbCredentials = {
    host: process.env.DATABASE_HOST!,
    user: process.env.DATABASE_USERNAME!,
    password: process.env.DATABASE_PASSWORD!,
    database: process.env.DATABASE_NAME!
};

export default defineConfig({
    out: './drizzle',
    schema: './src/db/schema.ts',
    dialect: 'mysql',
    dbCredentials: {
        host: process.env.DATABASE_HOST!,
        user: process.env.DATABASE_USERNAME!,
        password: process.env.DATABASE_PASSWORD!,
        database: process.env.DATABASE_NAME!
    },
    casing: 'snake_case'
});