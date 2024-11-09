import { and, desc, eq, getTableColumns, sql, count } from "drizzle-orm";
import { kegiatans, kompetensisToKegiatans, users, usersToKegiatans } from "../db/schema";
import { addTimestamps, batchQuerySize, db } from "./utilsModel";
import { userTableColumns } from "./usersModels";
import { userToKegiatanColumns } from "./penugasanModels";

export type KegiatanDataType = typeof kegiatans.$inferInsert
export const kegiatansColumns = getTableColumns(kegiatans)

//TODO Improve at query peformance
export async function fetchAllKegiatan() {
    return await db.query.kegiatans.findMany()
}

export async function fetchJumlahKegiatanAkanDilaksanakanByUser(uidUser: string, month?: number) {
    const prepared = db.select({ count: count(usersToKegiatans.kegiatanId) })
        .from(usersToKegiatans)
        .leftJoin(kegiatans, eq(kegiatans.kegiatanId, usersToKegiatans.kegiatanId))
        .where(and(
            eq(usersToKegiatans.userId, sql.placeholder('uidUser')),
            eq(usersToKegiatans.status, "ditugaskan"),
            month ? sql`MONTH(${kegiatans.tanggal}) = ${month}` : undefined
        )).prepare()

    const [res] = await prepared.execute({ uidUser })
    return res.count
}

export async function fetchKompetensiKegiatan(uidKegiatan: string) {
    const prepared = db.query.kegiatans.findFirst({
        where: ((kegiatans, { eq }) => eq(kegiatans.kegiatanId, sql.placeholder('uidKegiatan'))),
        with: {
            kompetensiKegiatan: true
        }
    }).prepare()

    const res = await prepared.execute({ uidKegiatan })
    const temp = res?.kompetensiKegiatan.map((dat) => {
        return dat.kompetensiId
    })

    return {
        ...res,
        kompetensi: temp,
        kompetensiKegiatan: undefined
    }
}

export async function fetchKegiatanByUser(uidUser: string, status?: 'ditugaskan' | 'selesai', wasLimitedTwo: boolean = false) {
    const prepared1 = db.select().from(users).where(eq(users.userId, sql.placeholder('uidUser'))).prepare();
    const [datUser] = await prepared1.execute({ uidUser })

    // Construct the base query with joins
    const prepared2 = db.select({
        ...kegiatansColumns,
        status: usersToKegiatans.status,
        role: usersToKegiatans.roleKegiatan
    })
        .from(usersToKegiatans)
        .leftJoin(kegiatans, eq(kegiatans.kegiatanId, usersToKegiatans.kegiatanId))
        .where(
            and(
                eq(usersToKegiatans.userId, sql.placeholder('uidUser')), // Match user ID
                status ? eq(usersToKegiatans.status, sql.placeholder('status')) : undefined, // Match status if provided
            )
        )
        .orderBy(desc(kegiatans.tanggal));

    // Apply limit if requested
    if (wasLimitedTwo) prepared2.limit(2);

    // Execute query
    prepared2.prepare()
    const kg = await prepared2.execute({ uidUser, status });

    // Return the user data with the kegiatan records
    return {
        ...datUser,
        kegiatan: kg
    };
}

export async function fetchUserCurrentKegiatan(uidUser: string, datetime: Date) {
    const prepared = db.select({ ...kegiatansColumns, status: usersToKegiatans.status, role: usersToKegiatans.roleKegiatan }).from(usersToKegiatans)
        .leftJoin(kegiatans, eq(kegiatans.kegiatanId, usersToKegiatans.kegiatanId))
        .where(and(eq(usersToKegiatans.userId, sql.placeholder('uidUser')), eq(kegiatans.tanggal, sql.placeholder('datetime')))).prepare()
    const [kegiatan] = await prepared.execute({ uidUser, datetime })

    return kegiatan
}

export async function fetchKegiatanByUid(uidKegiatan: string) {
    const prepared1 = db.query.kegiatans.findFirst({
        where: ((kegiatans, { eq }) => eq(kegiatans.kegiatanId, sql.placeholder('uidKegiatan'))),
        with: {
            lampiranKegiatan: true,
            agendaKegiatans: true
        }
    }).prepare()
    const kegiatan = await prepared1.execute({ uidKegiatan })

    const prepared2 = db.select({ ...userTableColumns, roleKegiatan: usersToKegiatans.roleKegiatan, status: userToKegiatanColumns.status }).from(usersToKegiatans)
        .leftJoin(users, eq(users.userId, usersToKegiatans.userId))
        .where(eq(usersToKegiatans.kegiatanId, sql.placeholder('uidKegiatan'))).prepare()
    const user = await prepared2.execute({ uidKegiatan })

    return {
        ...kegiatan,
        user
    }
}

export async function fetchKegiatanOnly(uidKegiatan: string) {
    const prepared = db.select().from(kegiatans).where(eq(kegiatans.kegiatanId, sql.placeholder('uidKegiatan'))).prepare()
    const [kegiatan] = await prepared.execute({ uidKegiatan })

    return kegiatan
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
            await tx.insert(kompetensisToKegiatans).values(batch).onDuplicateKeyUpdate({ set: { kegiatanId: sql`values(${kompetensisToKegiatans.kegiatanId})` } })
        }
    })

    const prep = db.query.kegiatans.findFirst({
        where: ((kegiatans, { eq }) => eq(kegiatans.kegiatanId, sql.placeholder('uidKegiatan'))),
        with: {
            kompetensiKegiatan: true
        }
    }).prepare()

    return await prep.execute({ uidKegiatan: idKegiatan!.kegiatanId })
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
                        kegiatanId: sql`values(${kompetensisToKegiatans.kegiatanId})`,
                    }
                })
            }
        }
    })

    const prep = db.query.kegiatans.findFirst({
        where: ((kegiatans, { eq }) => eq(kegiatans.kegiatanId, sql.placeholder('uidKegiatan'))),
        with: {
            kompetensiKegiatan: true
        }
    }).prepare()

    return await prep.execute({ uidKegiatan })
}

export async function deleteKegiatan(uidKegiatan: string) {
    const prepared = db.select().from(kegiatans).where(eq(kegiatans.kegiatanId, sql.placeholder('uidKegiatan'))).prepare()
    const [temp] = await prepared.execute({ uidKegiatan })
    
    await db.delete(kegiatans).where(eq(kegiatans.kegiatanId, uidKegiatan))

    return temp
}