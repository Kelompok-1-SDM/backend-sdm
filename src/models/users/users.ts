import { addTimestamps, db } from "../utils";
import { jumlahKegiatan, kompetensis, users, usersToKompetensis } from "../../db/schema";
import { and, eq, getTableColumns, isNull, sql } from "drizzle-orm";

export type UserDataType = typeof users.$inferInsert
export type UsersToKompetensiDataType = typeof usersToKompetensis.$inferInsert

const { password, ...rest } = getTableColumns(users)

async function fetchAllUser(showAllData: boolean = false) {
    return await db.select({ ...rest }).from(users).where(showAllData ? isNull(users.deletedAt) : undefined);
}

async function fetchUserByRole(role: 'admin' | 'manajemen' | 'dosen', showAllData: boolean = false) {
    return await db.select({ ...rest }).from(users).where(and(eq(users.role, role), showAllData ? isNull(users.deletedAt) : undefined))
}

async function fetchUserComplete(uidUser: string, showAllData: boolean = false) {
    return await db.select({ ...rest }).from(users)
        // Join kompetensis
        .innerJoin(usersToKompetensis, and(eq(usersToKompetensis.userId, users.userId), isNull(usersToKompetensis.deletedAt)))
        .innerJoin(kompetensis, and(eq(kompetensis.kompetensiId, usersToKompetensis.kompetensiId), isNull(kompetensis.deletedAt)))
        // Join jumlah_kegiatan
        .innerJoin(jumlahKegiatan, and(eq(jumlahKegiatan.userId, users.userId), isNull(jumlahKegiatan.deletedAt)))
        .where(and(eq(users.userId, uidUser), showAllData ? isNull(users.deletedAt) : undefined));
}

async function fetchUserOnly(uidUser: string) {
    return await db.select({ ...rest }).from(users).where(eq(users.userId, uidUser))
}

async function fetchUserForAuth(uidUser: string) {
    return await db.select().from(users).where(eq(users.userId, uidUser))
}

async function createUser(data: UserDataType[]) {
    data = addTimestamps(data)
    const [id] = await db.insert(users)
        .values(addTimestamps(data))
        .$returningId();

    return {
        userId: id.userId,
        ...data
    }
}

async function addUserKompetensi(uidUser: string, uidKompetensi: string[]) {

    let data: UsersToKompetensiDataType[]
    for (const kompetensiId of uidKompetensi) {
        data!.push(addTimestamps({
            userId: uidUser,
            kompetensiId: kompetensiId
        }))
    }

    await db.insert(usersToKompetensis).values(data!).onDuplicateKeyUpdate({
        set: {
            userId: sql`userId`,
        }
    })


    return await db.select().from(usersToKompetensis).where(eq(usersToKompetensis.userId, uidUser))
}

async function addJumlahKegiatan(uidUser: string, wasDecrement: boolean = false, year: number, month: number) {
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

async function updateUser(uidUser: string, data: Partial<UserDataType>) {
    await db.update(users).set(addTimestamps(data, true)).where(eq(users.userId, uidUser))

    return await db.select().from(users).where(eq(users.userId, uidUser))
}

async function updateKompetensiUser(uidUser: string, uidKompetensi: string[]) {

    let data: UsersToKompetensiDataType[]
    for (const uid of uidKompetensi) {
        data!.push(addTimestamps({
            userId: uidUser,
            kompetensiId: uid
        }, true))
    }
    await db.insert(usersToKompetensis).values(data!).onDuplicateKeyUpdate({
        set: addTimestamps({
            deletedAt: null
        }, true)
    })

    return await db.select().from(usersToKompetensis).where(eq(usersToKompetensis.userId, uidUser))
}

async function deleteUser(uidUser: string) {
    await db.update(users)
        .set(addTimestamps({ deletedAt: sql`NOW()` }, true))
        .where(eq(users.userId, uidUser))

    return await db.select().from(users).where(eq(users.userId, uidUser))
}

async function deleteUserKompetensi(uidUser: string, uidKompetensi: string[]) {
    await db.transaction(async (tx) => {
        for (const uidK of uidKompetensi) {
            await tx.update(usersToKompetensis)
                .set(addTimestamps({ deletedAt: sql`NOW()` }, true))
                .where(and(eq(usersToKompetensis.userId, uidUser), eq(usersToKompetensis.kompetensiId, uidK)))
        }
    })

    return await db.select().from(users).innerJoin(usersToKompetensis, eq(usersToKompetensis.userId, users.userId)).where(eq(users.userId, uidUser))
}

async function deleteJumlahKegiatan(uidUser: string, year: number, month: number) {
    await db.update(jumlahKegiatan)
        .set(addTimestamps({ deletedAt: sql`NOW()` }, true))
        .where(and(eq(jumlahKegiatan.userId, uidUser), eq(jumlahKegiatan.year, year), eq(jumlahKegiatan.month, month)))

    return await db.select().from(users).innerJoin(jumlahKegiatan, eq(jumlahKegiatan.userId, users.userId)).where(eq(jumlahKegiatan.userId, uidUser))
}