import { timestamp } from "drizzle-orm/mysql-core";

export const timestampsHelper = {
    updated_at: timestamp(),
    created_at: timestamp().defaultNow().notNull(),
    deleted_at: timestamp(),
}