import { eq, getTableColumns } from "drizzle-orm";
import { kegiatans, lampiranKegiatans } from "../db/schema";
import { addTimestamps, batchQuerySize, db } from "./utilsModel";

export type LampiranDataType = typeof lampiranKegiatans.$inferInsert
export const lampiranColumns = getTableColumns(lampiranKegiatans)


// export async function fetchLampiranByKegiatan(uidKegiatan: string) {
//     const temp = await db.select().from(lampiranKegiatans).where(eq(lampiranKegiatans.kegiatanId, uidKegiatan))
//     return temp
// }

export async function fetchLampiranByUid(uidLampiran: string) {
    const [temp] = await db.select().from(lampiranKegiatans).where(eq(lampiranKegiatans.lampiranId, uidLampiran))
    return temp
}

async function fetchKegiatanWithLampiran(uidKegiatan: string) {
    const [kgData] = await db.select().from(kegiatans).where(eq(kegiatans.kegiatanId, uidKegiatan))
    const lamp = await db.select().from(lampiranKegiatans).where(eq(lampiranKegiatans.kegiatanId, uidKegiatan))

    return {
        ...kgData,
        lampiran: lamp
    }
}

export async function createLampiran(dataLampiran: LampiranDataType[]) {
    const kegiatanId = dataLampiran[0].kegiatanId
    for (let i = 0; i < dataLampiran.length; i += batchQuerySize) {
        let batch: any[] = dataLampiran.slice(i, i + batchQuerySize);
        await db.insert(lampiranKegiatans).values(addTimestamps(batch))
    }

    return await fetchKegiatanWithLampiran(kegiatanId)
}

export async function deleteLampiranKegiatan(uidLampiran: string) {
    const [temp] = await db.select({ kegiatanId: lampiranKegiatans.kegiatanId }).from(lampiranKegiatans).where(eq(lampiranKegiatans.lampiranId, uidLampiran))
    await db.delete(lampiranKegiatans).where(eq(lampiranKegiatans.lampiranId, uidLampiran))

    return await fetchKegiatanWithLampiran(temp.kegiatanId)
}
