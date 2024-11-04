import { eq, getTableColumns, sql } from "drizzle-orm";
import { kompetensis } from "../db/schema";
import { db } from "./utilsModel";

export type KompetensiDataType = typeof kompetensis.$inferInsert
export const kompetensisColumns = getTableColumns(kompetensis)

export async function fetchAllKompentensi() {
    return await db.select().from(kompetensis)
}

export async function fetchKompetensiByUid(uidKompetensi: string) {
    const [temp] = await db.select().from(kompetensis).where(eq(kompetensis.kompetensiId, uidKompetensi))
    return temp
}

export async function createKompetensi(data: KompetensiDataType) {
    const [id] = await db.insert(kompetensis).values(data).$returningId()

    return await fetchKompetensiByUid(id.kompetensiId)
}

export async function updateKompetensi(uidKompetensi: string, data: Partial<KompetensiDataType>) {
    await db.update(kompetensis).set(data).where(eq(kompetensis.kompetensiId, uidKompetensi))

    return await fetchKompetensiByUid(uidKompetensi)
}

export async function deleteKompetensi(uidKompetensi: string) {
    const temp = await fetchKompetensiByUid(uidKompetensi)
    await db.delete(kompetensis).where(eq(kompetensis.kompetensiId, uidKompetensi))

    return temp
}