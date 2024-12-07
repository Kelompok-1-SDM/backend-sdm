import { and, desc, eq, getTableColumns, sql, count, or } from "drizzle-orm";
import { jabatanAnggota, jumlahKegiatan, kegiatans, tipeKegiatan, usersToKegiatans } from "../db/schema";
import { addTimestamps, batchQuerySize, db } from "./utilsModel";

export type KegiatanDataType = typeof kegiatans.$inferInsert
export const kegiatansColumns = getTableColumns(kegiatans)

//TODO Improve at query peformance
export async function fetchAllKegiatan() {
    const prepared = db.query.kegiatans.findMany({
        with: {
            tipeKegiatan: {
                columns: {
                    tipeKegiatan: true
                }
            }
        }
    }).prepare()

    const ap = await prepared.execute()

    const op = ap.map((it) => {
        return {
            ...it,
            tipeKegiatan: it.tipeKegiatan?.tipeKegiatan ?? null
        }
    })

    return op
}

export async function fetchJumlahKegiatanAkanDilaksanakanByUser(uidUser: string, month?: number) {

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
                eq(kegiatans.isDone, false),
                or(
                    month ? sql`MONTH(${kegiatans.tanggalMulai}) = ${month}` : undefined,
                    month ? sql`MONTH(${kegiatans.tanggalAkhir}) = ${month}` : undefined
                )
            )
        )
        .groupBy(usersToKegiatans.kegiatanId)
        .as('countSubquery');

    // Main query combining both subqueries
    const prepared = db
        .select({
            count: countSubquery.count,
        })
        .from(countSubquery)
        .prepare();

    // Execute the query
    const [res] = await prepared.execute({ uidUser });
    return {
        count: res?.count ?? 0
    };

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
        year: sql<number>`YEAR(${kegiatans.tanggalMulai})`,
        count: count(kegiatans.kegiatanId)
    })
        .from(kegiatans)
        .groupBy(sql<number>`YEAR(${kegiatans.tanggalMulai})`)
        .orderBy(sql<number>`YEAR(${kegiatans.tanggalMulai})`)
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

export async function fetchKegiatanByUser(uidUser: string, isDone?: boolean, tanggal?: string, wasLimitedTwo: boolean = false) {
    const formattedTanggal = tanggal ? new Date(tanggal).toISOString().split('T')[0] : undefined;

    const prepared2 = db
        .select({
            ...kegiatansColumns,
            jabatan: jabatanAnggota.namaJabatan,
            isPic: jabatanAnggota.isPic,
            tipeKegiatan: tipeKegiatan.tipeKegiatan
        })
        .from(usersToKegiatans)
        .leftJoin(kegiatans, eq(kegiatans.kegiatanId, usersToKegiatans.kegiatanId))
        .leftJoin(jabatanAnggota, eq(jabatanAnggota.jabatanId, usersToKegiatans.jabatanId))
        .leftJoin(tipeKegiatan, eq(kegiatans.tipeKegiatanId, tipeKegiatan.tipeKegiatanId))
        .where(
            and(
                eq(usersToKegiatans.userId, sql.placeholder("uidUser")),
                isDone ? eq(kegiatans.isDone, sql.placeholder("isDone")) : undefined,
                tanggal
                    ? eq(sql`DATE(${kegiatans.tanggalMulai})`, sql.placeholder("tanggal"))
                    : undefined
            )
        )
        .orderBy(desc(kegiatans.tanggalMulai));


    // Apply limit if requested
    if (wasLimitedTwo) prepared2.limit(2);

    // Execute query
    prepared2.prepare();
    let kg = await prepared2.execute({ uidUser, isDone, tanggal: formattedTanggal });

    // Return the user data with the kegiatan records
    return kg

}

export async function fetchUserCurrentKegiatan(uidUser: string, datetime: Date) {
    const prepared = db.select({ ...kegiatansColumns, jabatan: jabatanAnggota.namaJabatan, isPic: jabatanAnggota.isPic, tipeKegiatan: tipeKegiatan.tipeKegiatan }).from(usersToKegiatans)
        .leftJoin(kegiatans, eq(kegiatans.kegiatanId, usersToKegiatans.kegiatanId))
        .leftJoin(jabatanAnggota, eq(jabatanAnggota.jabatanId, usersToKegiatans.jabatanId))
        .leftJoin(tipeKegiatan, eq(kegiatans.tipeKegiatanId, tipeKegiatan.tipeKegiatanId))
        .where(and(eq(usersToKegiatans.userId, sql.placeholder('uidUser')), eq(kegiatans.tanggalMulai, sql.placeholder('datetime')))).prepare()
    const [kegiatan] = await prepared.execute({ uidUser, datetime })

    return kegiatan
}

export async function fetchKegiatanByUid(uidKegiatan: string) {
    const prepared = db.query.kegiatans.findFirst({
        where: ((kegiatans, { eq }) => eq(kegiatans.kegiatanId, sql.placeholder('uidKegiatan'))),
        with: {
            lampiran: true,
            tipeKegiatan: true,
            agenda: {
                with: {
                    agendaToUser: {
                        columns: {},
                        with: {
                            userToKegiatans: {
                                columns: {},
                                with: {
                                    users: {
                                        columns: {
                                            password: false
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            users: {
                with: {
                    jabatans: true,
                    users: {
                        columns: {
                            password: false
                        },
                    }
                }
            }
        },
    }).prepare()

    let kegiatan = await prepared.execute({ uidKegiatan })

    if (!kegiatan) return undefined

    return {
        ...kegiatan,
        agenda: kegiatan.agenda.map((it) => {
            return {
                ...it,
                users: it.agendaToUser.map((it1) => {
                    return {
                        ...it1.userToKegiatans.users
                    }
                }),

                agendaToUser: undefined
            }
        }),

        tipeKegiatan: kegiatan.tipeKegiatan?.tipeKegiatan ?? null,

        users: kegiatan.users ? kegiatan.users.map((it) => {
            return {
                ...it.users,
                namaJabatan: it.jabatans?.namaJabatan ?? null,
                isPic: it.jabatans?.isPic ?? null,
            }
        }).sort((a, b) => {
            const isPicA = a.isPic ?? false; // Treat null as false
            const isPicB = b.isPic ?? false; // Treat null as false
            return Number(isPicB) - Number(isPicA); // Convert boolean to number for comparison
        }) : undefined,
    }

}

export async function fetchKegiatanOnly(uidKegiatan: string) {
    const prepared = db.query.kegiatans.findFirst({
        where: ((kegiatans, { eq }) => eq(kegiatans.kegiatanId, sql.placeholder('uidKegiatan'))),
    }).prepare()
    const kegiatan = await prepared.execute({ uidKegiatan })

    return kegiatan ?? undefined
}

export async function createKegiatan(kegiatanData: KegiatanDataType) {
    let idKegiatan: { kegiatanId: string };
    [idKegiatan] = await db.insert(kegiatans).values(addTimestamps(kegiatanData)).$returningId()

    return await fetchKegiatanOnly(idKegiatan!.kegiatanId)
}

export async function updateKegiatan(uidKegiatan: string, data: Partial<KegiatanDataType>) {
    await db.update(kegiatans)
        .set(addTimestamps(data, true))
        .where(eq(kegiatans.kegiatanId, uidKegiatan))

    return await fetchKegiatanOnly(uidKegiatan)
}

export async function deleteKegiatan(uidKegiatan: string) {
    const keg = await fetchKegiatanOnly(uidKegiatan)

    await db.delete(kegiatans).where(eq(kegiatans.kegiatanId, uidKegiatan))

    return keg
}