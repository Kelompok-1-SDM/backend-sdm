import mysql from "mysql2/promise";
import * as schema from '../db/schema'
import { drizzle } from 'drizzle-orm/mysql2';
import { dbCredentials } from "../../drizzle.config";
import { sql } from "drizzle-orm";

const poolConnection = mysql.createPool(dbCredentials);
export const batchQuerySize = 10
export const db = drizzle({ client: poolConnection, casing: 'snake_case', schema, mode: 'default' });

//TODO Improve at query peformance
// Example timestamp wrapper function
export function addTimestamps(data: any, isUpdate = false) {
    const timestamp = sql`CURRENT_TIMESTAMP`;

    if (Array.isArray(data)) {
        return data.map(it => {
            // Only set createdAt if it's not an update and createdAt doesn't exist
            if (!isUpdate && !it.createdAt) {
                it.createdAt = timestamp;
            }
            it.updatedAt = timestamp; // Always update updatedAt
            return it; // Return modified object
        });
    } else {
        // Single object case
        if (!isUpdate && !data.createdAt) {
            data.createdAt = timestamp;
        }
        data.updatedAt = timestamp;
        return data; // Return modified object
    }
}
