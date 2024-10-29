import { eq, isNull, sql } from "drizzle-orm";
import { kompetensis } from "../db/schema";
import { db } from "./utilsModel";

type KompetensiDataType = typeof kompetensis.$inferInsert

export async function fetchAllKompentensi() {
    return await db.select().from(kompetensis)
}

export async function createKompetensi(data: KompetensiDataType) {
    const [id] = await db.insert(kompetensis).values(data).$returningId()

    return await db.select().from(kompetensis).where(eq(kompetensis.kompetensiId, id.kompetensiId))
}

export async function updateKompetensi(uidKompetensi: string, data: Partial<KompetensiDataType>) {
    await db.update(kompetensis).set(data).where(eq(kompetensis.kompetensiId, uidKompetensi))

    return await db.select().from(kompetensis).where(eq(kompetensis.kompetensiId, uidKompetensi))
}

export async function deleteKompetensi(uidKompetensi: string) {
    await db.delete(kompetensis).where(eq(kompetensis.kompetensiId, uidKompetensi))
}