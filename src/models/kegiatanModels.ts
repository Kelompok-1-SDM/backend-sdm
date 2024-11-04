import { and, desc, eq, getTableColumns, sql, count } from "drizzle-orm";
import { agendaKegiatans, jumlahKegiatan, kegiatans, kompetensis, kompetensisToKegiatans, lampiranKegiatans, users, usersToKegiatans } from "../db/schema";
import { addTimestamps, batchQuerySize, db } from "./utilsModel";
import { userTableColumns } from "./usersModels";
import { userToKegiatanColumns } from "./penugasanModels";
import { kompetensisColumns } from "./kompetensiModels";

export type KegiatanDataType = typeof kegiatans.$inferInsert
export const kegiatansColumns = getTableColumns(kegiatans)

export async function fetchAllKegiatan() {
    return await db.select().from(kegiatans)
}

export async function fetchJumlahKegiatanAkanDilaksanakanByUser(uidUser: string, month?: number) {
    const [jumlahKeg] = await db.select({ count: count(usersToKegiatans.kegiatanId) })
        .from(usersToKegiatans)
        .leftJoin(kegiatans, eq(kegiatans.kegiatanId, usersToKegiatans.kegiatanId))
        .where(and(
            eq(usersToKegiatans.userId, uidUser),
            eq(usersToKegiatans.status, "ditugaskan"),
            month ? sql`MONTH(${kegiatans.tanggal}) = ${month}` : undefined
        ))

    return jumlahKeg.count
}


export async function fetchKegiatanByUser(uidUser: string, status?: 'ditugaskan' | 'selesai', wasLimitedTwo: boolean = false) {
    const [datUser] = await db.select(userTableColumns).from(users).where(eq(users.userId, uidUser));

    // Construct the base query with joins
    const query = db.select({
        ...kegiatansColumns,
        status: usersToKegiatans.status,
        role: usersToKegiatans.roleKegiatan
    })
        .from(usersToKegiatans)
        .rightJoin(kegiatans, eq(kegiatans.kegiatanId, usersToKegiatans.kegiatanId))
        .where(
            and(
                eq(usersToKegiatans.userId, uidUser), // Match user ID
                status ? eq(usersToKegiatans.status, status) : undefined, // Match status if provided
            )
        )
        .orderBy(desc(kegiatans.tanggal));

    // Apply limit if requested
    if (wasLimitedTwo) query.limit(2);

    // Execute query
    const kg = await query;

    // Return the user data with the kegiatan records
    return {
        ...datUser,
        kegiatan: kg
    };
}


export async function fetchUserCurrentKegiatan(uidUser: string, datetime: Date) {
    const [kg] = await db.select({ ...kegiatansColumns, status: usersToKegiatans.status, role: usersToKegiatans.roleKegiatan }).from(usersToKegiatans)
        .rightJoin(kegiatans, eq(kegiatans.kegiatanId, usersToKegiatans.kegiatanId))
        .where(and(eq(usersToKegiatans.userId, uidUser), eq(kegiatans.tanggal, datetime)))

    return kg
}

export async function fetchKegiatanByUid(uidKegiatan: string) {
    const [kgData] = await db.select().from(kegiatans).where(eq(kegiatans.kegiatanId, uidKegiatan))

    const userData = await db.select({ ...userToKegiatanColumns, user: { ...userTableColumns } }).from(usersToKegiatans)
        .rightJoin(users, eq(users.userId, usersToKegiatans.userId))
        .where(eq(usersToKegiatans.kegiatanId, uidKegiatan))

    const lampiranData = await db.select().from(lampiranKegiatans).where(eq(lampiranKegiatans.kegiatanId, uidKegiatan))
    const agendaData = await db.select().from(agendaKegiatans).where(eq(agendaKegiatans.kegiatanId, uidKegiatan))

    return {
        ...kgData,
        user: userData,
        lampiran: lampiranData,
        agenda: agendaData
    }
}

export async function fetchKegiatanOnly(uidKegiatan: string) {
    const [temp] = await db.select().from(kegiatans).where(eq(kegiatans.kegiatanId, uidKegiatan))
    return temp
}

export async function createKegiatan(kegiatanData: KegiatanDataType, listKompetensiUid: string[]) {
    let idKegiatan: { kegiatanId: string };

    await db.transaction(async (tx) => {
        [idKegiatan] = await tx.insert(kegiatans).values(addTimestamps(kegiatanData)).$returningId()

        for (let i = 0; i < listKompetensiUid.length; i += batchQuerySize) {
            let batch: any[] = listKompetensiUid.slice(i, i + batchQuerySize);
            batch = batch.map((tex) => {
                return addTimestamps({
                    kegiatanId: idKegiatan.kegiatanId,
                    kompetensiId: tex
                })
            })
            await tx.insert(kompetensisToKegiatans).values(batch).onDuplicateKeyUpdate({ set: { kegiatanId: sql`kegiatan_id` } })
        }
    })

    const [kg] = await db.select().from(kegiatans).where(eq(kegiatans.kegiatanId, idKegiatan!.kegiatanId))
    const dataKompe = await db.select(kompetensisColumns).from(kompetensisToKegiatans).innerJoin(kompetensis, eq(kompetensis.kompetensiId, kompetensisToKegiatans.kompetensiId)).where(eq(kompetensisToKegiatans.kegiatanId, kg.kegiatanId))
    return {
        ...kg,
        kompetensi: dataKompe
    }
}

export async function updateKegiatan(uidKegiatan: string, data: Partial<KegiatanDataType>, listKompetensiUid: string[]) {
    await db.transaction(async (tx) => {
        await tx.update(kegiatans)
            .set(addTimestamps(data, true))
            .where(eq(kegiatans.kegiatanId, uidKegiatan))

        if (listKompetensiUid.length !== 0) {
            for (let i = 0; i < listKompetensiUid.length; i += batchQuerySize) {
                let batch: any[] = listKompetensiUid.slice(i, i + batchQuerySize);
                batch = batch.map((tex) => {
                    return addTimestamps({
                        kegiatanId: uidKegiatan,
                        kompetensiId: tex
                    })
                })
                await tx.insert(kompetensisToKegiatans).values(batch).onDuplicateKeyUpdate({
                    set: {
                        kegiatanId: sql`kegiatan_id`,
                    }
                })
            }
        }
    })

    const [kg] = await db.select().from(kegiatans).where(eq(kegiatans.kegiatanId, uidKegiatan))
    const dataKompe = await db.select(kompetensisColumns).from(kompetensisToKegiatans).innerJoin(kompetensis, eq(kompetensis.kompetensiId, kompetensisToKegiatans.kompetensiId)).where(eq(kompetensisToKegiatans.kegiatanId, kg.kegiatanId))
    return {
        ...kg,
        kompetensi: dataKompe
    }
}

export async function deleteKegiatan(uidKegiatan: string) {
    const [temp] = await db.select().from(kegiatans).where(eq(kegiatans.kegiatanId, uidKegiatan))
    await db.delete(kegiatans).where(eq(kegiatans.kegiatanId, uidKegiatan))

    return temp
}