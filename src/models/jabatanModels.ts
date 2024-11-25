import { eq, getTableColumns, sql } from "drizzle-orm";
import { jabatanAnggota } from "../db/schema";
import { addTimestamps, db } from "./utilsModel";

export type JabatanDataType = typeof jabatanAnggota.$inferInsert
export const jabatansColumns = getTableColumns(jabatanAnggota)
//TODO Improve at query peformance
export async function fetchAllJabatan() {
    return await db.query.jabatanAnggota.findMany({
        orderBy: (jabatanAnggota, { desc }) => [desc(jabatanAnggota.isPic)]
    })
}

export async function fetchJabatanByUid(uidjabatan: string) {
    const prepared = db.select().from(jabatanAnggota).where(eq(jabatanAnggota.jabatanId, sql.placeholder('uidjabatan'))).prepare()
    const [temp] = await prepared.execute({ uidjabatan })

    return temp
}

export async function createJabatan(data: JabatanDataType) {
    const [id] = await db.insert(addTimestamps(jabatanAnggota)).values(data).$returningId()

    return await fetchJabatanByUid(id.jabatanId)
}

export async function updateJabatan(uidjabatan: string, data: Partial<JabatanDataType>) {
    await db.update(jabatanAnggota).set(addTimestamps(data, true)).where(eq(jabatanAnggota.jabatanId, uidjabatan))

    return await fetchJabatanByUid(uidjabatan)
}

export async function deleteJabatan(uidjabatan: string) {
    const temp = await fetchJabatanByUid(uidjabatan)
    await db.delete(jabatanAnggota).where(eq(jabatanAnggota.jabatanId, uidjabatan))

    return temp
}