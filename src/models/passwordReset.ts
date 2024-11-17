import { db } from "./utilsModel";
import { resetPassword } from "../db/schema";
import { eq, and, gt } from 'drizzle-orm';

export async function createResetToken(userId: string, token: string, expiresAt: Date) {
    await db.insert(resetPassword).values({ userId, token, expiresAt });
}

export async function findResetToken(hash: string) {
    const result = await db.select()
        .from(resetPassword)
        .where(and(eq(resetPassword.token, hash), gt(resetPassword.expiresAt, new Date())));
    return result[0] || null;
}

export async function deleteResetToken(userId: string) {
    await db.delete(resetPassword).where(eq(resetPassword.userId, userId));
}
