import mysql from "mysql2/promise";
import { drizzle } from 'drizzle-orm/mysql2';
import { dbCredentials } from "../../drizzle.config";

const poolConnection = mysql.createPool(dbCredentials);
export const batchQuerySize = 10
export const db = drizzle({ client: poolConnection, casing: 'snake_case', logger: true });

// Example timestamp wrapper function
export function addTimestamps(data: any, isUpdate = false) {
    const timestamp = new Date();

    if (Array.isArray(data)) {
        data.forEach(it => {
            // Set createdAt only if not already set and it's not an update operation
            if (!isUpdate && !it.createdAt) {
                it.createdAt = timestamp;
            }
            it.updatedAt = timestamp;
        });
    } else {
        // Set createdAt only if not already set and it's not an update operation
        if (!isUpdate && !data.createdAt) {
            data.createdAt = timestamp;
        }

        data.updatedAt = timestamp;
    }

    return data;
};