import { addTimestamps, db } from "./utilsModel";
import { jumlahKegiatan, users, usersToKompetensis } from "../db/schema";
import { and, eq, getTableColumns, sql, count } from "drizzle-orm";

export type UserDataType = typeof users.$inferInsert
export type UsersToKompetensiDataType = typeof usersToKompetensis.$inferInsert
export const { password, ...userTableColumns } = getTableColumns(users)
export const { userId, updatedAt, createdAt, ...jumlahKegitanColumns } = getTableColumns(jumlahKegiatan)
//TODO Improve at query peformance
export async function fetchAllUser() {
    const prepared = db.query.users.findMany({
        columns: {
            password: false
        },
        with: {
            usersKompetensi: {
                with: {
                    kompetensi: true  // Fetch the related 'kompetensi' data
                }
            }
        }
    }).prepare()

    let dat = await prepared.execute()

    // Extracting users with all their details, but only the list of 'namaKompetensi' from the 'kompetensi' relation
    const temp = dat.map((user) => {
        return {
            ...user,  // Spread the rest of the user information
            kompetensi: user.usersKompetensi.map((kompetensiJunction) =>
                kompetensiJunction.kompetensi?.namaKompetensi  // Extract 'namaKompetensi' from the 'kompetensi' object
            ),
            usersKompetensi: undefined
        }
    })

    return temp
}

export async function fetchUserByRole(role: 'admin' | 'manajemen' | 'dosen') {
    const prepared = db.query.users.findMany({
        columns: {
            password: false
        },
        with: {
            usersKompetensi: {
                with: {
                    kompetensi: true  // Fetch the related 'kompetensi' data
                }
            }
        },
        where: ((users, { eq }) => eq(users.role, sql.placeholder('role')))
    }).prepare()

    let dat = await prepared.execute({ role })

    // Extracting users with all their details, but only the list of 'namaKompetensi' from the 'kompetensi' relation
    const temp = dat.map((user) => {
        return {
            ...user,  // Spread the rest of the user information
            kompetensi: user.usersKompetensi.map((kompetensiJunction) =>
                kompetensiJunction.kompetensi?.namaKompetensi  // Extract 'namaKompetensi' from the 'kompetensi' object
            ),
            usersKompetensi: undefined
        }
    })

    return temp
}

export async function fetchUserComplete(uidUser?: string, nip?: string) {
    const prepared = db.query.users.findFirst({
        columns: {
            password: false
        },
        with: {
            usersKompetensi: {
                with: {
                    kompetensi: true  // Fetch the related 'kompetensi' data
                }
            }
        },
        where: ((users, { eq }) => nip ? eq(users.nip, sql.placeholder('nip')) : eq(users.userId, sql.placeholder('uidUser')))
    }).prepare()

    let dat = await prepared.execute(nip ? { nip } : { uidUser })

    // Extracting users with all their details, but only the list of 'namaKompetensi' from the 'kompetensi' relation
    const temp = dat?.usersKompetensi ? dat!.usersKompetensi.map((kompetensi) => {
        return kompetensi.kompetensi.namaKompetensi
    }) : null

    return dat ? {
        ...dat,
        kompetensi: temp,
        usersKompetensi: undefined
    } : undefined
}

export async function fetchUserCount(role: 'dosen' | 'manajemen') {
    const prepared = db.select({ count: count(users.userId) }).from(users).where(eq(users.role, sql.placeholder('role'))).prepare()
    const [res] = await prepared.execute({ role })

    return res.count
}

export async function fetchUserStatistic(uidUser: string, year: number) {
    const prepared = db.select({ nama: users.nama }).from(users).where(eq(users.userId, sql.placeholder('uidUser'))).prepare();
    const [dataUser] = await prepared.execute({ uidUser })

    const prepared1 = db.select(jumlahKegitanColumns).from(jumlahKegiatan).where(year ? and(eq(jumlahKegiatan.userId, sql.placeholder('uidUser')), eq(jumlahKegiatan.year, sql.placeholder('year'))) : eq(jumlahKegiatan.userId, sql.placeholder('uidUser'))).prepare()
    const dataJumlahKegiatan = await prepared1.execute(year ? { uidUser, year } : { uidUser })

    let totalDalamSetahun: number = 0
    dataJumlahKegiatan.map((it) => totalDalamSetahun += it.jumlahKegiatan)

    const firstName = dataUser.nama ? dataUser.nama.split(' ')[0] : '';

    return {
        firstName,
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

export async function createBatchUser(data: UserDataType[]) {
    await db.insert(users).values(addTimestamps(data)).onDuplicateKeyUpdate({
        set: {
            userId: sql`values(${users.userId})`
        }
    })
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
            userToJumlahKegiatan: true
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

export async function updateUserPassword(userId: string, newPassword: string) {
    await db.update(users).set({ password: newPassword }).where(eq(users.userId, userId)).execute();
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

    return await fetchUserComplete(uidUser)
}