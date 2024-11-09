import { addTimestamps, db } from "./utilsModel";
import { jumlahKegiatan, kompetensis, users, usersToKompetensis } from "../db/schema";
import { and, desc, eq, getTableColumns, sql } from "drizzle-orm";
import { kompetensisColumns } from "./kompetensiModels";

export type UserDataType = typeof users.$inferInsert
export type UsersToKompetensiDataType = typeof usersToKompetensis.$inferInsert
export const { password, ...userTableColumns } = getTableColumns(users)
//TODO Improve at query peformance
export async function fetchAllUser() {
    return await db.select({ ...userTableColumns }).from(users).orderBy(desc(users.nama));
}

export async function fetchUserByRole(role: 'admin' | 'manajemen' | 'dosen') {
    const prepared = db.select({ ...userTableColumns }).from(users).where(eq(users.role, sql.placeholder('role'))).prepare()

    return await prepared.execute({ role })
}

export async function fetchUserComplete(uidUser?: string, nip?: string) {
    const prepared = db.select({ ...userTableColumns }).from(users).where(nip ? eq(users.nip, sql.placeholder('nip')) : eq(users.userId, sql.placeholder('uidUser'))).prepare();
    const [dataUser] = await prepared.execute(nip ? { nip } : { uidUser })
    if (!dataUser) return

    const prepared1 = db.select(kompetensisColumns).from(usersToKompetensis)
        .leftJoin(kompetensis, eq(usersToKompetensis.kompetensiId, kompetensis.kompetensiId))
        .where(eq(usersToKompetensis.userId, sql.placeholder('uidUser'))).prepare()
    const dataKompetensi = await prepared1.execute({ uidUser: dataUser.userId })

    return {
        ...dataUser,
        kompetensi: dataKompetensi
    }
}

export async function fetchUserStatistic(uidUser: string, year: number) {
    const prepared = db.select({ ...userTableColumns }).from(users).where(eq(users.userId, sql.placeholder('uidUser'))).prepare();
    const [dataUser] = await prepared.execute({ uidUser })

    const prepared1 = db.select().from(jumlahKegiatan).where(year ? and(eq(jumlahKegiatan.userId, sql.placeholder('uidUser')), eq(jumlahKegiatan.year, sql.placeholder('year'))) : eq(jumlahKegiatan.userId, sql.placeholder('uidUser'))).prepare()
    const dataJumlahKegiatan = await prepared1.execute(year ? { uidUser, year } : { uidUser })

    let totalDalamSetahun: number = 0
    dataJumlahKegiatan.map((it) => totalDalamSetahun += it.jumlahKegiatan)

    return {
        ...dataUser,
        totalDalamSetahun,
        jumlahKegiatan: dataJumlahKegiatan
    }
}

export async function fetchUserByUid(uidUser: string) {
    const prepared = db.select({ ...userTableColumns }).from(users).where(eq(users.userId, sql.placeholder('uidUser'))).prepare()
    const [res] = await prepared.execute({ uidUser })

    return res
}

export async function fetchUserForAuth(nip: string) {
    const prepared = db.select().from(users).where(eq(users.nip, sql.placeholder('nip'))).prepare()
    const [res] = await prepared.execute({ nip })

    return res
}

export async function createUser(data: UserDataType) {
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
    const data: UsersToKompetensiDataType[] = uidKompetensi.map((it) => {
        return addTimestamps({
            userId: uidUser,
            kompetensiId: it
        })
    })

    await db.insert(usersToKompetensis).values(data!).onDuplicateKeyUpdate({
        set: {
            userId: sql`values(${usersToKompetensis.userId})`,
        }
    })

    return await fetchUserComplete(uidUser)
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

    const prepared = db.query.users.findFirst({
        where: ((user, { eq }) => eq(user.userId, sql.placeholder('uidUser'))),
        with: {
            userToJumlahKegiatam: true
        }
    }).prepare()
    const data = await prepared.execute({ uidUser })

    return data
}

export async function updateUser(uidUser: string, data: Partial<UserDataType>) {
    await db.update(users).set(addTimestamps(data, true)).where(eq(users.userId, uidUser))

    const prepared = db.select({ ...userTableColumns }).from(users).where(eq(users.userId, sql.placeholder('uidUser'))).prepare()
    const [res] = await prepared.execute({ uidUser })
    return res
}

export async function deleteUser(uidUser: string) {
    const user = await fetchUserByUid(uidUser)

    await db.delete(users).where(eq(users.userId, uidUser))

    return user
}

export async function deleteUserKompetensi(uidUser: string, uidKompetensi: string[]) {
    await db.transaction(async (tx) => {
        await Promise.all(uidKompetensi.map(async (it) => {
            await tx.delete(usersToKompetensis)
                .where(and(eq(usersToKompetensis.userId, uidUser), eq(usersToKompetensis.kompetensiId, it)))
        }))
    })

    const prepared = db.query.users.findFirst({
        where: ((users, { eq }) => eq(users.userId, sql.placeholder('uidUser'))),
        with: {
            usersKompetensi: true
        }
    }).prepare()
    const res = await prepared.execute({ uidUser })

    return res
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