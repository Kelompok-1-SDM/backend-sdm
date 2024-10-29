import { timestamp } from "drizzle-orm/mysql-core";

export const timestampsHelper = {
    updatedAt: timestamp(),
    createdAt: timestamp().defaultNow().notNull()
}