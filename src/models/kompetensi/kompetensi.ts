import { eq, isNull, sql } from "drizzle-orm";
import { kompetensis } from "../../db/schema";
import { db } from "../utils";

type KompetensiDataType = typeof kompetensis.$inferInsert

async function fetchAllKompentensi(showAllData: boolean = false) {
    return await db.select().from(kompetensis).where(showAllData ? isNull(kompetensis.deletedAt) : undefined)
}

async function createKompetensi(data: KompetensiDataType) {
    const [id] = await db.insert(kompetensis).values(data).$returningId()

    return await db.select().from(kompetensis).where(eq(kompetensis.kompetensiId, id.kompetensiId))
}

async function updateKompetensi(uidKompetensi: string, data: Partial<KompetensiDataType>) {
    await db.update(kompetensis).set(data).where(eq(kompetensis.kompetensiId, uidKompetensi))

    return await db.select().from(kompetensis).where(eq(kompetensis.kompetensiId, uidKompetensi))
}

async function deleteKompetensi(uidKompetensi: string) {
    await db.update(kompetensis).set({ deletedAt: sql`NOW()` }).where(eq(kompetensis.kompetensiId, uidKompetensi))
}