import { and, eq, getTableColumns, sql } from "drizzle-orm";
import { jabatanAnggota, usersToKegiatans } from "../db/schema";
import { addTimestamps, batchQuerySize, db } from "./utilsModel";

export const userToKegiatanColumns = getTableColumns(usersToKegiatans)

// Internal Only
export async function fetchUserJabatanInKegiatan(uidKegiatan: string, uidUser: string) {
    const prepared = db.select({ isPic: jabatanAnggota.isPic }).from(usersToKegiatans).leftJoin(jabatanAnggota, eq(jabatanAnggota.jabatanId, usersToKegiatans.jabatanId)).where(and(eq(usersToKegiatans.kegiatanId, sql.placeholder('uidKegiatan')), eq(usersToKegiatans.userId, sql.placeholder('uidUser')))).prepare()
    const [temp] = await prepared.execute({ uidKegiatan, uidUser })

    return temp
}

export async function fetchKegiatanWithUser(uidKegiatan: string, uidUser?: string) {
    const prepared = db.query.usersToKegiatans.findMany({
        where: ((usersToKegiatans, { eq }) => and(
            eq(usersToKegiatans.kegiatanId, sql.placeholder('uidKegiatan')),
            uidUser ? eq(usersToKegiatans.userId, sql.placeholder('uidUser')) : undefined
        )),
        with: {
            jabatans: true
        }
    }).prepare()

    const apa = await prepared.execute(uidUser ? { uidKegiatan, uidUser } : { uidKegiatan })

    const opo = apa.map((it) => {
        return {
            ...it,
            namaJabatan: it.jabatans.namaJabatan,
            jabatans: undefined
        }
    })

    return opo ?? undefined
}


export async function createPenugasan(uidKegiatan: string, listUserDitugaskan: { uid_user: string, uid_jabatan: string }[]) {
    for (let i = 0; i < listUserDitugaskan.length; i += batchQuerySize) {
        let batch: any[] = listUserDitugaskan.slice(i, i + batchQuerySize);
        batch = batch.map((user) => {
            return addTimestamps({
                kegiatanId: uidKegiatan,
                userId: user.uid_user,
                jabatanId: user.uid_jabatan
            })
        })
        await db.insert(usersToKegiatans).values(batch!).onDuplicateKeyUpdate({ set: { userToKegiatanId: sql`values(${usersToKegiatans.userToKegiatanId})` } })
    }

    return await fetchKegiatanWithUser(uidKegiatan)
}

export async function updatePenugasanKegiatan(uidKegiatan: string, listUserDitugaskan: { uid_user: string, uid_jabatan: string }[]) {
    for (let i = 0; i < listUserDitugaskan.length; i += batchQuerySize) {
        let batch: any[] = listUserDitugaskan.slice(i, i + batchQuerySize);
        batch = batch.map((user) => {
            return addTimestamps({
                kegiatanId: uidKegiatan,
                userId: user.uid_user,
                jabatanId: user.uid_jabatan
            })
        })
        await db.insert(usersToKegiatans).values(batch!).onDuplicateKeyUpdate({
            set: addTimestamps({
                userToKegiatanId: sql`values(${usersToKegiatans.userToKegiatanId})`,
                jabatanId: sql`values(${usersToKegiatans.jabatanId})`,
            }, true)
        })
    }

    return await fetchKegiatanWithUser(uidKegiatan)
}

export async function deletePenugasan(uidKegiatan: string, uidUser: string) {
    await db.delete(usersToKegiatans).where(and(eq(usersToKegiatans.kegiatanId, uidKegiatan), eq(usersToKegiatans.userId, uidUser)))

    return await fetchKegiatanWithUser(uidKegiatan)
}