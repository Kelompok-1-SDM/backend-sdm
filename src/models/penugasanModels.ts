import { and, eq, getTableColumns, sql } from "drizzle-orm";
import { usersToKegiatans } from "../db/schema";
import { addTimestamps, batchQuerySize, db } from "./utilsModel";

export const userToKegiatanColumns = getTableColumns(usersToKegiatans)

// Internal Only
export async function fetchUserRoleInKegiatan(uidKegiatan: string, uidUser: string) {
    const prepared = db.select({ role: usersToKegiatans.roleKegiatan }).from(usersToKegiatans).where(and(eq(usersToKegiatans.kegiatanId, sql.placeholder('uidKegiatan')), eq(usersToKegiatans.userId, sql.placeholder('uidUser')))).prepare()
    const [temp] = await prepared.execute({ uidKegiatan, uidUser })

    return temp
}

async function fetchKegiatanWithUser(uidKegiatan: string) {
    const prepared = db.query.kegiatans.findFirst({
        where: ((kegiatans, { eq }) => eq(kegiatans.kegiatanId, sql.placeholder('uidKegiatan'))),
        with: {
            usersKegiatans: true
        }
    }).prepare()
    const dat = await prepared.execute({ uidKegiatan })
    return {
        ...dat,
        user: dat?.usersKegiatans,

        usersKegiatans: undefined
    }
}


export async function createPenugasan(uidKegiatan: string, listUserDitugaskan: { uid_user: string, role: 'pic' | 'anggota' }[]) {
    for (let i = 0; i < listUserDitugaskan.length; i += batchQuerySize) {
        let batch: any[] = listUserDitugaskan.slice(i, i + batchQuerySize);
        batch = batch.map((user) => {
            return addTimestamps({
                kegiatanId: uidKegiatan,
                userId: user.uid_user,
                roleKegiatan: user.role
            })
        })
        await db.insert(usersToKegiatans).values(batch!).onDuplicateKeyUpdate({ set: { userId: sql`values(${usersToKegiatans.userId})` } })
    }

    return await fetchKegiatanWithUser(uidKegiatan)
}

export async function updatePenugasanKegiatan(uidKegiatan: string, listUserDitugaskan: { uid_user: string, role: 'pic' | 'anggota', status: 'ditugaskan' | 'selesai' }[]) {
    for (let i = 0; i < listUserDitugaskan.length; i += batchQuerySize) {
        let batch: any[] = listUserDitugaskan.slice(i, i + batchQuerySize);
        batch = batch.map((user) => {
            return addTimestamps({
                kegiatanId: uidKegiatan,
                userId: user.uid_user,
                roleKegiatan: user.role
            })
        })
        await db.insert(usersToKegiatans).values(batch!).onDuplicateKeyUpdate({
            set: addTimestamps({
                roleKegiatan: sql`values(${usersToKegiatans.roleKegiatan})`,
                status: sql`values(${usersToKegiatans.status})`
            }, true)
        })
    }

    return await fetchKegiatanWithUser(uidKegiatan)
}

export async function deletePenugasan(uidKegiatan: string, uidUser: string) {
    await db.delete(usersToKegiatans).where(and(eq(usersToKegiatans.kegiatanId, uidKegiatan), eq(usersToKegiatans.userId, uidUser)))

    return await fetchKegiatanWithUser(uidKegiatan)
}