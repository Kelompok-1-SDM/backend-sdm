import { addTimestamps, db } from "./utilsModel";
import { jumlahKegiatan, kompetensis, users, usersToKompetensis } from "../db/schema";
import { and, eq, getTableColumns, isNull, sql } from "drizzle-orm";

export type UserDataType = typeof users.$inferInsert
export type UsersToKompetensiDataType = typeof usersToKompetensis.$inferInsert

const { password, ...rest } = getTableColumns(users)

export async function fetchAllUser() {
    return await db.select({ ...rest }).from(users);
}

export async function fetchUserByRole(role: 'admin' | 'manajemen' | 'dosen') {
    return await db.select({ ...rest }).from(users).where(eq(users.role, role))
}

export async function fetchUserComplete(uidUser: string) {
    const [res] = await db.select({ ...rest }).from(users)
        // Join kompetensis
        .innerJoin(usersToKompetensis, eq(usersToKompetensis.userId, users.userId))
        .innerJoin(kompetensis, eq(kompetensis.kompetensiId, usersToKompetensis.kompetensiId))
        // Join jumlah_kegiatan
        .innerJoin(jumlahKegiatan, eq(jumlahKegiatan.userId, users.userId))
        .where(eq(users.userId, uidUser));
    return res
}

export async function fetchUserOnly(uidUser: string) {
    const [res] = await db.select({ ...rest }).from(users).where(eq(users.userId, uidUser))
    return res
}

export async function fetchUserForAuth(nip: string) {
    const [res] = await db.select().from(users).where(eq(users.nip, nip))
    return res
}

export async function createUser(data: UserDataType) {
    data = addTimestamps(data)

    const [res] = await db.insert(users)
        .values(addTimestamps(data))
        .$returningId();

    const { password, ...rest } = data
    return {
        userId: res!.userId,
        ...rest
    }
}

export async function addUserKompetensi(uidUser: string, uidKompetensi: string[]) {

    let data: UsersToKompetensiDataType[]
    for (const kompetensiId of uidKompetensi) {
        data!.push(addTimestamps({
            userId: uidUser,
            kompetensiId: kompetensiId
        }))
    }

    await db.insert(usersToKompetensis).values(data!).onDuplicateKeyUpdate({
        set: {
            userId: sql`user_id`,
        }
    })


    return await db.select().from(usersToKompetensis).where(eq(usersToKompetensis.userId, uidUser))
}

export async function addJumlahKegiatan(uidUser: string, wasDecrement: boolean = false, year: number, month: number) {
    await db.insert(jumlahKegiatan)
        .values(addTimestamps({
            userId: uidUser,
            year: year,
            month: month,
            jumlahKegiatan: 1,
        })).onDuplicateKeyUpdate({
            set: addTimestamps({
                jumlahKegiatan: sql`${jumlahKegiatan.jumlahKegiatan} + ${wasDecrement ? -1 : 1}`
            }, true)
        })

    return await db.select().from(users)
        .innerJoin(jumlahKegiatan, eq(jumlahKegiatan.userId, users.userId))
        .where(eq(users.userId, uidUser))
}

export async function updateUser(uidUser: string, data: Partial<UserDataType>) {
    await db.update(users).set(addTimestamps(data, true)).where(eq(users.userId, uidUser))

    return await db.select().from(users).where(eq(users.userId, uidUser))
}

export async function updateKompetensiUser(uidUser: string, uidKompetensi: string[]) {

    let data: UsersToKompetensiDataType[]
    for (const uid of uidKompetensi) {
        data!.push(addTimestamps({
            userId: uidUser,
            kompetensiId: uid
        }, true))
    }
    await db.insert(usersToKompetensis).values(data!).onDuplicateKeyUpdate({
        set: addTimestamps({
            userId: sql`user_id`
        }, true)
    })

    return await db.select().from(usersToKompetensis).where(eq(usersToKompetensis.userId, uidUser))
}

export async function deleteUser(uidUser: string) {
    await db.delete(users)
        .where(eq(users.userId, uidUser))

    return await db.select().from(users).where(eq(users.userId, uidUser))
}

export async function deleteUserKompetensi(uidUser: string, uidKompetensi: string[]) {
    await db.transaction(async (tx) => {
        for (const uidK of uidKompetensi) {
            await tx.delete(usersToKompetensis)
                .where(and(eq(usersToKompetensis.userId, uidUser), eq(usersToKompetensis.kompetensiId, uidK)))
        }
    })

    return await db.select().from(users).innerJoin(usersToKompetensis, eq(usersToKompetensis.userId, users.userId)).where(eq(users.userId, uidUser))
}

export async function deleteJumlahKegiatan(uidUser: string, year: number, month: number) {
    await db.delete(jumlahKegiatan)
        .where(and(eq(jumlahKegiatan.userId, uidUser), eq(jumlahKegiatan.year, year), eq(jumlahKegiatan.month, month)))

    return await db.select().from(users).innerJoin(jumlahKegiatan, eq(jumlahKegiatan.userId, users.userId)).where(eq(jumlahKegiatan.userId, uidUser))
}