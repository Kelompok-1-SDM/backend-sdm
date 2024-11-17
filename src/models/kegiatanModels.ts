import { and, desc, eq, getTableColumns, sql, count } from "drizzle-orm";
import { jumlahKegiatan, kegiatans, kompetensis, kompetensisToKegiatans, users, usersToKegiatans, usersToKompetensis } from "../db/schema";
import { addTimestamps, batchQuerySize, db } from "./utilsModel";
import { userTableColumns } from "./usersModels";

export type KegiatanDataType = typeof kegiatans.$inferInsert
export const kegiatansColumns = getTableColumns(kegiatans)

//TODO Improve at query peformance
export async function fetchAllKegiatan() {
    const prepared = db.query.kegiatans.findMany({
        with: {
            kompetensiKegiatan: {
                with: {
                    kompetensi: true
                }
            }
        }
    }).prepare()

    const dat = await prepared.execute()
    return dat.map((it) => {
        return {
            ...it,
            kompetensi: it.kompetensiKegiatan.map((kompe) => kompe.kompetensi.namaKompetensi),
            kompetensiKegiatan: undefined
        }
    })
}

export async function fetchJumlahKegiatanAkanDilaksanakanByUser(uidUser: string, month?: number) {
    // Subquery for kompetensiList
    const kompetensiSubquery = db
        .select({
            kegiatanId: kompetensisToKegiatans.kegiatanId,
            kompetensiList: sql<string>`
        GROUP_CONCAT(${kompetensis.namaKompetensi} ORDER BY ${kompetensis.namaKompetensi})`
                .as('kompetensiList')
        })
        .from(kompetensisToKegiatans)
        .innerJoin(kompetensis, eq(kompetensis.kompetensiId, kompetensisToKegiatans.kompetensiId))
        .groupBy(kompetensisToKegiatans.kegiatanId)
        .as('kompetensiSubquery');

    // Subquery for counting kegiatanId
    const countSubquery = db
        .select({
            kegiatanId: usersToKegiatans.kegiatanId,
            count: count(usersToKegiatans.kegiatanId).as('count')
        })
        .from(usersToKegiatans)
        .leftJoin(kegiatans, eq(kegiatans.kegiatanId, usersToKegiatans.kegiatanId))
        .where(
            and(
                eq(usersToKegiatans.userId, sql.placeholder('uidUser')),
                eq(usersToKegiatans.status, 'ditugaskan'),
                month ? sql`MONTH(${kegiatans.tanggal}) = ${month}` : undefined
            )
        )
        .groupBy(usersToKegiatans.kegiatanId)
        .as('countSubquery');

    // Main query combining both subqueries
    const prepared = db
        .select({
            count: countSubquery.count,
            kompetensiList: kompetensiSubquery.kompetensiList,
        })
        .from(countSubquery)
        .leftJoin(kompetensiSubquery, eq(kompetensiSubquery.kegiatanId, countSubquery.kegiatanId))
        .prepare();

    // Execute the query
    const [res] = await prepared.execute({ uidUser });
    return {
        count: res.count ?? 0,
        kompetensiList: res.kompetensiList ? res.kompetensiList.split(',').slice(0, 3) : [],
    };

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

export async function fetchPeformaKegiatan(year: number) {
    const prepared = db.select({
        month: jumlahKegiatan.month,
        avgJumlahKegiatan: sql<number>`avg(${jumlahKegiatan.jumlahKegiatan})`
    })
        .from(jumlahKegiatan)
        .where(eq(jumlahKegiatan.year, sql.placeholder('year')))
        .groupBy(jumlahKegiatan.month)
        .orderBy(jumlahKegiatan.month)
        .prepare()

    let res = await prepared.execute({ year })
    const maxAvgJumlahKegiatan = Math.max(...res.map(row => row.avgJumlahKegiatan + 3));
    return { results: res, maxAdjustedAvg: maxAvgJumlahKegiatan }
}

export async function fetchKegiatanCountEachYear() {
    const prepared = db.select({
        year: sql<number>`YEAR(${kegiatans.tanggal})`,
        count: count(kegiatans.kegiatanId)
    })
        .from(kegiatans)
        .groupBy(sql<number>`YEAR(${kegiatans.tanggal})`)
        .orderBy(sql<number>`YEAR(${kegiatans.tanggal})`)
        .prepare()
    const res = await prepared.execute()
    const maxAvgJumlahKegiatan = Math.max(...res.map(row => row.count + 3));

    return { results: res, maxAdjustedAvg: maxAvgJumlahKegiatan }
}

export async function fetchKegiatanCountAll() {
    const prepared = db.select({ count: count(kegiatans.kegiatanId) })
        .from(kegiatans)
        .prepare()
    const [res] = await prepared.execute()

    return res.count
}

export async function fetchKegiatanByUser(uidUser: string, status?: 'ditugaskan' | 'selesai', tanggal?: string, wasLimitedTwo: boolean = false) {
    const prepared1 = db.select(userTableColumns).from(users).where(eq(users.userId, sql.placeholder('uidUser'))).prepare();
    const [datUser] = await prepared1.execute({ uidUser });

    const formattedTanggal = tanggal ? new Date(tanggal).toISOString().split('T')[0] : undefined;

    const prepared2 = db
        .select({
            ...kegiatansColumns,
            status: usersToKegiatans.status,
            role: usersToKegiatans.roleKegiatan,
        })
        .from(usersToKegiatans)
        .leftJoin(kegiatans, eq(kegiatans.kegiatanId, usersToKegiatans.kegiatanId))
        .where(
            and(
                eq(usersToKegiatans.userId, sql.placeholder("uidUser")),
                status ? eq(usersToKegiatans.status, sql.placeholder("status")) : undefined,
                tanggal
                    ? eq(sql`DATE(${kegiatans.tanggal})`, sql.placeholder("tanggal"))
                    : undefined
            )
        )
        .orderBy(desc(kegiatans.tanggal));


    // Apply limit if requested
    if (wasLimitedTwo) prepared2.limit(2);

    // Execute query
    prepared2.prepare();
    let kg = await prepared2.execute({ uidUser, status, tanggal: formattedTanggal });

    // Query to get kompetensi names only
    const prepared3 = db
        .select({
            namaKompetensi: kompetensis.namaKompetensi
        })
        .from(kompetensisToKegiatans)
        .innerJoin(kompetensis, eq(kompetensis.kompetensiId, kompetensisToKegiatans.kompetensiId))
        .where(eq(kompetensisToKegiatans.kegiatanId, sql.placeholder('kegiatanUid')))
        .prepare();

    kg = await Promise.all(kg.map(async (it) => {
        const kompetensiData = await prepared3.execute({ kegiatanUid: it.kegiatanId });
        const kompetensiNames = kompetensiData.map((komp) => komp.namaKompetensi);

        return {
            ...it,
            kompetensi: kompetensiNames
        };
    }));

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
            agendaKegiatans: true,
            kompetensiKegiatan: {
                with: {
                    kompetensi: true // Fetch the related 'kompetensi' data
                }
            },
            usersKegiatans: true
        }
    }).prepare()

    let kegiatan = await prepared1.execute({ uidKegiatan })

    if (!kegiatan) return undefined

    const prepared3 = db
        .select({
            namaKompetensi: kompetensis.namaKompetensi
        })
        .from(usersToKompetensis)
        .innerJoin(kompetensis, eq(kompetensis.kompetensiId, usersToKompetensis.kompetensiId))
        .where(eq(usersToKompetensis.userId, sql.placeholder('uidUser')))
        .limit(3)
        .prepare();

    kegiatan.usersKegiatans = await Promise.all(kegiatan.usersKegiatans.map(async (it) => {
        const kompetensiData = await prepared3.execute({ uidUser: it.userId });
        const kompetensiNames = kompetensiData.map((komp) => komp.namaKompetensi);

        return {
            ...it,
            kompetensi: kompetensiNames
        };
    }));

    // Extract the kompetensi (namaKompetensi) from kompetensiKegiatan
    const kompe = kegiatan.kompetensiKegiatan.map((it) => it.kompetensi.namaKompetensi)

    // Return the transformed result, renaming fields as needed
    return {
        ...kegiatan, // Spread all other properties of kegiatan
        kompetensi: kompe, // Rename kompetensiKegiatan to kompetensi and keep only namaKompetensi
        lampiran: kegiatan.lampiranKegiatan, // Keep lampiranKegiatan as lampiran
        agenda: kegiatan.agendaKegiatans, // Keep agendaKegiatans as agenda
        user: kegiatan.usersKegiatans,

        kompetensiKegiatan: undefined, // Remove kompetensiKegiatan from the result
        lampiranKegiatan: undefined,
        agendaKegiatans: undefined,
        usersKegiatans: undefined
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

    const data = await fetchKegiatanByUid(idKegiatan!.kegiatanId)

    return {
        ...data,

        lampiran: undefined,
        agenda: undefined,
        user: undefined
    }
}

export async function updateKegiatan(uidKegiatan: string, data: Partial<KegiatanDataType>, listKompetensiUid: string[]) {
    await db.transaction(async (tx) => {
        await tx.update(kegiatans)
            .set(addTimestamps(data, true))
            .where(eq(kegiatans.kegiatanId, uidKegiatan))

        if (listKompetensiUid && listKompetensiUid.length !== 0) {
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

    const dat = await fetchKegiatanByUid(uidKegiatan)

    return {
        ...dat,

        lampiran: undefined,
        agenda: undefined,
        user: undefined
    }
}

export async function deleteKegiatan(uidKegiatan: string) {
    const keg = await fetchKegiatanByUid(uidKegiatan)

    await db.delete(kegiatans).where(eq(kegiatans.kegiatanId, uidKegiatan))

    return {
        ...keg,

        lampiran: undefined,
        agenda: undefined,
        user: undefined
    }
}