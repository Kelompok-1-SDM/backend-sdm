import { addTimestamps, db } from "./utilsModel";
import { jumlahKegiatan, kompetensis, users, usersToKompetensis } from "../db/schema";
import { and, desc, eq, getTableColumns, sql } from "drizzle-orm";
import { kompetensisColumns } from "./kompetensiModels";

export type UserDataType = typeof users.$inferInsert
export type UsersToKompetensiDataType = typeof usersToKompetensis.$inferInsert
export const { password, ...userTableColumns } = getTableColumns(users)

export async function fetchAllUser() {
    return await db.select({ ...userTableColumns }).from(users).orderBy(desc(users.nama));
}

export async function fetchUserByRole(role: 'admin' | 'manajemen' | 'dosen') {
    return await db.select({ ...userTableColumns }).from(users).where(eq(users.role, role))
}

export async function fetchUserComplete(uidUser?: string, nip?: string) {
    let dataUser, dataKompetensi
    [dataUser] = await db.select({ ...userTableColumns }).from(users).where(nip ? eq(users.nip, nip) : eq(users.userId, uidUser!));
    console.log(nip)

    if (!dataUser) return

    dataKompetensi = await db.select(kompetensisColumns).from(usersToKompetensis)
        .rightJoin(kompetensis, eq(usersToKompetensis.kompetensiId, kompetensis.kompetensiId))
        .where(eq(usersToKompetensis.userId, dataUser.userId))

    return {
        ...dataUser,
        kompetensi: dataKompetensi
    }
}

export async function fetchUserStatistic(uidUser: string, year: number) {
    const [dataUser] = await db.select({ ...userTableColumns }).from(users).where(eq(users.userId, uidUser));
    const dataJumlahKegiatan = await db.select().from(jumlahKegiatan).where(year ? and(eq(jumlahKegiatan.userId, uidUser), eq(jumlahKegiatan.year, year)) : eq(jumlahKegiatan.userId, uidUser))

    let totalDalamSetahun: number = 0
    for (const dat of dataJumlahKegiatan) {
        totalDalamSetahun += dat.jumlahKegiatan
    }

    return {
        ...dataUser,
        totalDalamSetahun,
        jumlahKegiatan: dataJumlahKegiatan
    }
}

export async function fetchUserByUid(uidUser: string) {
    const [res] = await db.select({ ...userTableColumns }).from(users).where(eq(users.userId, uidUser))
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

    let data: UsersToKompetensiDataType[] = []
    for (const kompetensiId of uidKompetensi) {
        data!.push(addTimestamps({
            userId: uidUser,
            kompetensiId: kompetensiId
        }))
    }

    await db.insert(usersToKompetensis).values(data!).onDuplicateKeyUpdate({
        set: {
            userId: sql`values(${usersToKompetensis.userId})`,
        }
    })

    const userKompetensi = await db.select().from(usersToKompetensis).where(eq(usersToKompetensis.userId, uidUser))
    const user = await fetchUserByUid(uidUser)
    return {
        ...user,
        kompetensi: userKompetensi
    }
}

// Internal only
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

    const jmlhKgh = await db.select().from(jumlahKegiatan).where(eq(jumlahKegiatan.userId, uidUser))
    const user = await fetchUserByUid(uidUser)
    return {
        ...user,
        jumlahKegiatan: jmlhKgh
    }
}

export async function updateUser(uidUser: string, data: Partial<UserDataType>) {
    await db.update(users).set(addTimestamps(data, true)).where(eq(users.userId, uidUser))
    const [res] = await db.select({ ...userTableColumns }).from(users).where(eq(users.userId, uidUser))
    return res
}

export async function deleteUser(uidUser: string) {
    const user = await fetchUserByUid(uidUser)
    await db.delete(users).where(eq(users.userId, uidUser))

    return user
}

export async function deleteUserKompetensi(uidUser: string, uidKompetensi: string[]) {
    await db.transaction(async (tx) => {
        for (const uidK of uidKompetensi) {
            await tx.delete(usersToKompetensis)
                .where(and(eq(usersToKompetensis.userId, uidUser), eq(usersToKompetensis.kompetensiId, uidK)))
        }
    })

    const userKompetensi = await db.select().from(usersToKompetensis).where(eq(usersToKompetensis.userId, uidUser))
    const user = await fetchUserByUid(uidUser)
    return {
        ...user,
        kompetensi: userKompetensi
    }
}

// export async function deleteJumlahKegiatan(uidUser: string, year: number, month: number) {
//     await db.delete(jumlahKegiatan)
//         .where(and(eq(jumlahKegiatan.userId, uidUser), eq(jumlahKegiatan.year, year), eq(jumlahKegiatan.month, month)))

//     const jmlhKgh = await db.select().from(jumlahKegiatan).where(eq(jumlahKegiatan.userId, uidUser))
//     const user = await fetchUserByUid(uidUser)
//     return {
//         ...user,
//         jumlahKegiatan: jmlhKgh
//     }
// }