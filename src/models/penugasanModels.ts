import { and, eq, getTableColumns, sql } from "drizzle-orm";
import * as usersModels from '../models/usersModels'
import * as kegiatanModels from '../models/kegiatanModels'
import { agendaToUsersKegiatans, jabatanAnggota, usersToKegiatans } from "../db/schema";
import { addTimestamps, batchQuerySize, db } from "./utilsModel";

export const userToKegiatanColumns = getTableColumns(usersToKegiatans)

// Internal Only
export async function fetchUserJabatanInKegiatan(uidKegiatan: string, uidUser: string) {
    const prepared = db.select({ isPic: jabatanAnggota.isPic })
        .from(usersToKegiatans)
        .leftJoin(jabatanAnggota, eq(jabatanAnggota.jabatanId, usersToKegiatans.jabatanId))
        .where(
            and(
                eq(usersToKegiatans.kegiatanId, sql.placeholder('uidKegiatan')),
                eq(usersToKegiatans.userId, sql.placeholder('uidUser'))
            )
        ).prepare()
    const [temp] = await prepared.execute({ uidKegiatan, uidUser })

    return temp
}

export async function fetchUserInAgenda(uidAgenda: string, uidUser: string) {
    const prepared = db.select()
        .from(agendaToUsersKegiatans)
        .leftJoin(usersToKegiatans, eq(usersToKegiatans.userToKegiatanId, agendaToUsersKegiatans.userToKegiatanId))
        .where(
            and(
                eq(agendaToUsersKegiatans.agendaId, sql.placeholder('uidAgenda')),
                eq(usersToKegiatans.userId, sql.placeholder('uidUser'))
            )
        ).prepare()
    const [temp] = await prepared.execute({ uidAgenda, uidUser })

    return temp
}

export async function fetchKegiatanWithUser(uidKegiatan: string, uidUser?: string) {
    // Fetch the main data
    const prepared = db.query.usersToKegiatans.findMany({
        where: ((usersToKegiatans, { eq }) => and(
            eq(usersToKegiatans.kegiatanId, sql.placeholder('uidKegiatan')),
            uidUser ? eq(usersToKegiatans.userId, sql.placeholder('uidUser')) : undefined
        )),
        with: {
            jabatans: true,
            users: true,
        }
    }).prepare();

    const apa = await prepared.execute(uidUser ? { uidKegiatan, uidUser } : { uidKegiatan });

    // Fetch agenda counts for the relevant userToKegiatanIds
    const userToKegiatanIds = apa.map(it => it.userToKegiatanId);
    if (userToKegiatanIds.length === 0) {
        return []; // Return early if no data found
    }

    const agendaCounts = await db.select({
        userToKegiatanId: agendaToUsersKegiatans.userToKegiatanId,
        agendaCount: sql<number>`COUNT(*)`.as('agenda_count'),
    })
        .from(agendaToUsersKegiatans)
        .where(
            sql`${agendaToUsersKegiatans.userToKegiatanId} IN ${userToKegiatanIds}`
        )
        .groupBy(agendaToUsersKegiatans.userToKegiatanId)
        .execute();

    // Create a map of userToKegiatanId to agenda count
    const countsMap = Object.fromEntries(
        agendaCounts.map(item => [item.userToKegiatanId, item.agendaCount])
    );

    // Combine main data with agenda counts
    const opo = apa.map((it) => {
        return {
            ...it,
            namaJabatan: it.jabatans?.namaJabatan ?? null,
            isPic: it.jabatans?.isPic ?? null,
            nama: it.users.nama,
            agendaCount: countsMap[it.userToKegiatanId] || 0,
            jabatans: undefined,
            users: undefined
        };
    }).sort((a, b) => a.agendaCount - b.agendaCount); // Sort in descending order

    return opo ?? undefined;
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