import { eq, getTableColumns, sql } from "drizzle-orm";
import { tipeKegiatan } from "../db/schema";
import { addTimestamps, db } from "./utilsModel";

export type TipeKegiatanDataType = typeof tipeKegiatan.$inferInsert
export const tipeKegiatansColumns = getTableColumns(tipeKegiatan)
//TODO Improve at query peformance
export async function fetchAllTipeKegiatan(isJti?: boolean) {
    return await db.query.tipeKegiatan.findMany({
        where: isJti != null ? (tipeKegiatan, { eq }) => eq(tipeKegiatan.isJti, isJti) : undefined,
    });
}

export async function fetchTipeKegiatanByUid(uidtipeKegiatan: string) {
    const prepared = db.select().from(tipeKegiatan).where(eq(tipeKegiatan.tipeKegiatanId, sql.placeholder('uidtipeKegiatan'))).prepare()
    const [temp] = await prepared.execute({ uidtipeKegiatan })

    return temp
}

export async function createTipeKegiatan(data: TipeKegiatanDataType) {
    const [id] = await db.insert(addTimestamps(tipeKegiatan)).values(data).$returningId()

    return await fetchTipeKegiatanByUid(id.tipeKegiatanId)
}

export async function updateTipeKegiatan(uidtipeKegiatan: string, data: Partial<TipeKegiatanDataType>) {
    await db.update(tipeKegiatan).set(addTimestamps(data, true)).where(eq(tipeKegiatan.tipeKegiatanId, uidtipeKegiatan))

    return await fetchTipeKegiatanByUid(uidtipeKegiatan)
}

export async function deleteTipeKegiatan(uidtipeKegiatan: string) {
    const temp = await fetchTipeKegiatanByUid(uidtipeKegiatan)
    await db.delete(tipeKegiatan).where(eq(tipeKegiatan.tipeKegiatanId, uidtipeKegiatan))

    return temp
}