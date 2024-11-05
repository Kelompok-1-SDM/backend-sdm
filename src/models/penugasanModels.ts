import { and, desc, eq, getTableColumns, sql } from "drizzle-orm";
import { kegiatans, users, usersToKegiatans } from "../db/schema";
import { addTimestamps, batchQuerySize, db } from "./utilsModel";
import { userTableColumns } from "./usersModels";
import { kegiatansColumns } from "./kegiatanModels";

export const userToKegiatanColumns = getTableColumns(usersToKegiatans)


export async function fetchUserRoleInKegiatan(uideKegiatan: string, uidUser: string) {
    const [temp] = await db.select({ role: usersToKegiatans.roleKegiatan }).from(usersToKegiatans).where(and(eq(usersToKegiatans.kegiatanId, uideKegiatan), eq(usersToKegiatans.userId, uidUser)))
    return temp
}

async function fetchKegiatanWithUser(uidKegiatan: string) {
    const [kgData] = await db.select().from(kegiatans).where(eq(kegiatans.kegiatanId, uidKegiatan))
    const userData = await db.select({ ...kegiatansColumns, user: userTableColumns }).from(usersToKegiatans)
        .rightJoin(users, eq(users.userId, usersToKegiatans.userId))
        .where(eq(usersToKegiatans.kegiatanId, uidKegiatan))

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
                userId: user.uid,
                roleKegiatan: user.role
            })
        })
        await db.insert(usersToKegiatans).values(batch!).onDuplicateKeyUpdate({ set: { userId: sql`user_id` } })
    }

    return await fetchKegiatanWithUser(uidKegiatan)
}

export async function updatePenugasanKegiatan(uidKegiatan: string, listUserDitugaskan: { uid_user: string, role: 'pic' | 'anggota', status: 'ditugaskan' | 'selesai' }[]) {
    for (let i = 0; i < listUserDitugaskan.length; i += batchQuerySize) {
        let batch: any[] = listUserDitugaskan.slice(i, i + batchQuerySize);
        batch = batch.map((user) => {
            return addTimestamps({
                kegiatanId: uidKegiatan,
                userId: user.uid,
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