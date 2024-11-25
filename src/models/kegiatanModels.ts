import { and, desc, eq, getTableColumns, sql, count, or } from "drizzle-orm";
import { jabatanAnggota, jumlahKegiatan, kegiatans, kompetensis, kompetensisToKegiatans, usersToKegiatans } from "../db/schema";
import { addTimestamps, batchQuerySize, db } from "./utilsModel";
import { kompetensisColumns } from "./kompetensiModels";

export type KegiatanDataType = typeof kegiatans.$inferInsert
export const kegiatansColumns = getTableColumns(kegiatans)

//TODO Improve at query peformance
export async function fetchAllKegiatan() {
    const prepared = db.query.kegiatans.findMany().prepare()

    return await prepared.execute()
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
            kompetensiList: kompetensiSubquery.kompetensiList,
        })
        .from(countSubquery)
        .leftJoin(kompetensiSubquery, eq(kompetensiSubquery.kegiatanId, countSubquery.kegiatanId))
        .prepare();

    // Execute the query
    const [res] = await prepared.execute({ uidUser });
    return {
        count: res?.count ?? 0,
        kompetensiList: res?.kompetensiList ? res.kompetensiList.split(',').slice(0, 3) : [],
    };

}

export async function fetchKompetensiKegiatan(uidKegiatan: string) {
    const prepared = db.query.kegiatans.findFirst({
        where: ((kegiatans, { eq }) => eq(kegiatans.kegiatanId, sql.placeholder('uidKegiatan'))),
        with: {
            kompetensi: true
        }
    }).prepare()

    const res = await prepared.execute({ uidKegiatan })

    return {
        ...res,
        kompetensi: res?.kompetensi.map((dat) => {
            return dat.kompetensiId
        })
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
            isPic: jabatanAnggota.isPic
        })
        .from(usersToKegiatans)
        .leftJoin(kegiatans, eq(kegiatans.kegiatanId, usersToKegiatans.kegiatanId))
        .leftJoin(jabatanAnggota, eq(jabatanAnggota.jabatanId, usersToKegiatans.jabatanId))
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

    // Query to get kompetensi names only
    const prepared3 = db
        .select(kompetensisColumns)
        .from(kompetensisToKegiatans)
        .innerJoin(kompetensis, eq(kompetensis.kompetensiId, kompetensisToKegiatans.kompetensiId))
        .where(eq(kompetensisToKegiatans.kegiatanId, sql.placeholder('kegiatanUid')))
        .prepare();

    kg = await Promise.all(kg.map(async (it) => {
        const kompetensiData = await prepared3.execute({ kegiatanUid: it.kegiatanId });

        return {
            ...it,
            kompetensi: kompetensiData
        };
    }));

    // Return the user data with the kegiatan records
    return kg

}

export async function fetchUserCurrentKegiatan(uidUser: string, datetime: Date) {
    const prepared = db.select({ ...kegiatansColumns, jabatan: jabatanAnggota.namaJabatan, isPic: jabatanAnggota.isPic }).from(usersToKegiatans)
        .leftJoin(kegiatans, eq(kegiatans.kegiatanId, usersToKegiatans.kegiatanId))
        .leftJoin(jabatanAnggota, eq(jabatanAnggota.jabatanId, usersToKegiatans.jabatanId))
        .where(and(eq(usersToKegiatans.userId, sql.placeholder('uidUser')), eq(kegiatans.tanggalMulai, sql.placeholder('datetime')))).prepare()
    const [kegiatan] = await prepared.execute({ uidUser, datetime })

    return kegiatan
}

export async function fetchKegiatanByUid(uidKegiatan: string) {
    const prepared = db.query.kegiatans.findFirst({
        where: ((kegiatans, { eq }) => eq(kegiatans.kegiatanId, sql.placeholder('uidKegiatan'))),
        with: {
            lampiran: true,
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
            kompetensi: {
                columns: {},
                with: {
                    kompetensis: true // Fetch the related 'kompetensi' data
                }
            },
            users: {
                with: {
                    jabatans: true,
                    users: {
                        columns: {
                            password: false
                        },
                        with: {
                            kompetensis: {
                                columns: {},
                                with: {
                                    kompetensi: true
                                }
                            }
                        }
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

        users: kegiatan.users ? kegiatan.users.map((it) => {
            return {
                ...it.users,
                namaJabatan: it.jabatans.namaJabatan,
                isPic: it.jabatans.isPic,
                kompetensi: it.users.kompetensis.map((its) => { return { ...its.kompetensi } }).slice(0, 2),
                kompetensis: undefined
            }
        }).sort((a, b) => {
            const isPicA = a.isPic ?? false; // Treat null as false
            const isPicB = b.isPic ?? false; // Treat null as false
            return Number(isPicB) - Number(isPicA); // Convert boolean to number for comparison
        }) : undefined,

        kompetensi: kegiatan.kompetensi.map((it) => it.kompetensis)
    }

}

export async function fetchKegiatanOnly(uidKegiatan: string) {
    const prepared = db.query.kegiatans.findFirst({
        where: ((kegiatans, { eq }) => eq(kegiatans.kegiatanId, sql.placeholder('uidKegiatan'))),
        with: {
            kompetensi: true
        }
    }).prepare()
    const kegiatan = await prepared.execute({ uidKegiatan })

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

    return await fetchKegiatanOnly(idKegiatan!.kegiatanId)
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

    return await fetchKegiatanOnly(uidKegiatan)
}

export async function deleteKegiatan(uidKegiatan: string) {
    const keg = await fetchKegiatanOnly(uidKegiatan)

    await db.delete(kegiatans).where(eq(kegiatans.kegiatanId, uidKegiatan))

    return keg
}

export async function deleteKommpetensiFromkegiatan(uidKegiatan: string, uidKompetensi: string) {
    await db.delete(kompetensisToKegiatans).where(and(eq(kompetensisToKegiatans.kegiatanId, uidKegiatan), eq(kompetensisToKegiatans.kompetensiId, uidKompetensi)))

    return await fetchKegiatanOnly(uidKegiatan)
}