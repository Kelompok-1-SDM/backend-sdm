import { and, eq, getTableColumns, sql } from "drizzle-orm";
import { kegiatans, users, usersToKegiatans } from "../db/schema";
import { addTimestamps, batchQuerySize, db } from "./utilsModel";
import { userTableColumns } from "./usersModels";
import { kegiatansColumns } from "./kegiatanModels";

export const userToKegiatanColumns = getTableColumns(usersToKegiatans)

// Internal Only
export async function fetchUserRoleInKegiatan(uidKegiatan: string, uidUser: string) {
    const prepared = db.select({ role: usersToKegiatans.roleKegiatan }).from(usersToKegiatans).where(and(eq(usersToKegiatans.kegiatanId, sql.placeholder('uidKegiatan')), eq(usersToKegiatans.userId, sql.placeholder('uidUser')))).prepare()
    const [temp] = await prepared.execute({ uidKegiatan, uidUser })

    return temp
}

async function fetchKegiatanWithUser(uidKegiatan: string) {
    const prepared = db.select().from(kegiatans).where(eq(kegiatans.kegiatanId, sql.placeholder('uidKegiatan'))).prepare()
    const [kgData] = await prepared.execute({ uidKegiatan })

    const prepared1 = db.select({ ...kegiatansColumns, user: userTableColumns }).from(usersToKegiatans)
        .rightJoin(kegiatans, eq(kegiatans.kegiatanId, usersToKegiatans.kegiatanId))
        .rightJoin(users, eq(users.userId, usersToKegiatans.userId))
        .where(eq(usersToKegiatans.kegiatanId, sql.placeholder('uidKegiatan'))).prepare()
    const userData = await prepared1.execute({ uidKegiatan })

    return {
        ...kgData,
        anggota: userData
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