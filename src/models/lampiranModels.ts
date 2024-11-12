import { eq, getTableColumns, sql } from "drizzle-orm";
import { lampiranKegiatans } from "../db/schema";
import { addTimestamps, batchQuerySize, db } from "./utilsModel";

export type LampiranDataType = typeof lampiranKegiatans.$inferInsert
export const lampiranColumns = getTableColumns(lampiranKegiatans)

//TODO Improve at query peformance
export async function fetchLampiranByUid(uidLampiran: string) {
    const prepared = db.select().from(lampiranKegiatans).where(eq(lampiranKegiatans.lampiranId, sql.placeholder('uidLampiran'))).prepare()
    const [temp] = await prepared.execute({ uidLampiran })

    return temp
}

async function fetchKegiatanWithLampiran(uidKegiatan: string) {
    const prepared = db.query.kegiatans.findFirst({
        where: ((kegiatans, { eq }) => eq(kegiatans.kegiatanId, sql.placeholder('uidKegiatan'))),
        with: {
            lampiranKegiatan: true
        }
    }).prepare()

    const dat = await prepared.execute({ uidKegiatan })

    return {
        ...dat,
        lampiran: dat?.lampiranKegiatan,

        lampiranKegiatan: undefined
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
    const prepared = db.select({ kegiatanId: lampiranKegiatans.kegiatanId }).from(lampiranKegiatans).where(eq(lampiranKegiatans.lampiranId, sql.placeholder("uidLampiran"))).prepare()
    const [temp] = await prepared.execute({ uidLampiran })
    
    await db.delete(lampiranKegiatans).where(eq(lampiranKegiatans.lampiranId, uidLampiran))

    return await fetchKegiatanWithLampiran(temp.kegiatanId)
}
