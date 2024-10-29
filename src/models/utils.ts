import mysql from "mysql2/promise";
import { drizzle } from 'drizzle-orm/mysql2';
import { dbCredentials } from "../../drizzle.config";

const poolConnection = mysql.createPool(dbCredentials);

export const db = drizzle({ client: poolConnection, casing: 'snake_case' });

// Example timestamp wrapper function
export const addTimestamps = (data: any, isUpdate = false) => {
    const timestamp = new Date().toISOString();

    if (Array.isArray(data)) {
        data.forEach(it => {
            // Set createdAt only if not already set and it's not an update operation
            if (!isUpdate && !it.createdAt) {
                it.createdAt = timestamp;
            }
            // Always set updatedAt on both insert and update
            it.updatedAt = timestamp;
        });
    } else {
        // Set createdAt only if not already set and it's not an update operation
        if (!isUpdate && !data.createdAt) {
            data.createdAt = timestamp;
        }

        // Always set updatedAt on both insert and update
        data.updatedAt = timestamp;
    }

    return data;
};