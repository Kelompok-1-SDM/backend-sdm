import { addTimestamps, db } from "./utilsModel";
import { jumlahKegiatan, users } from "../db/schema";
import { and, eq, getTableColumns, sql, count } from "drizzle-orm";

export type UserDataType = typeof users.$inferInsert
export const { password, ...userTableColumns } = getTableColumns(users)
export const { userId, updatedAt, createdAt, ...jumlahKegitanColumns } = getTableColumns(jumlahKegiatan)
//TODO Improve at query peformance

export async function fetchAllUser() {
    const prepared = db.query.users.findMany({
        columns: {
            password: false, // Exclude password
        },
        extras: {
            totalJumlahKegiatan: sql<number>`
                (
                    SELECT COALESCE(SUM(jk.jumlah_kegiatan), 0)
                    FROM jumlah_kegiatan jk
                    WHERE jk.user_id = users.user_id
                )
            `.as('totalJumlahKegiatan'),
        },
    }).prepare();

    return await prepared.execute();
}


export async function fetchUserComplete(uidUser?: string, nip?: string) {
    const prepared = db.query.users.findFirst({
        columns: {
            password: false
        },
        extras: {
            totalJumlahKegiatan: sql<number>`
                (
                    SELECT COALESCE(SUM(jk.jumlah_kegiatan), 0)
                    FROM jumlah_kegiatan jk
                    WHERE jk.user_id = users.user_id
                )
            `.as('totalJumlahKegiatan'),
        },
        where: ((users, { eq }) => nip ? eq(users.nip, sql.placeholder('nip')) : eq(users.userId, sql.placeholder('uidUser')))
    }).prepare()

    let dat = await prepared.execute(nip ? { nip } : { uidUser })

    return dat ?? undefined
}

export async function fetchUserByRole(role: 'admin' | 'manajemen' | 'dosen') {
    const prepared = db.query.users.findMany({
        columns: {
            password: false
        },
        extras: {
            totalJumlahKegiatan: sql<number>`
                (
                    SELECT COALESCE(SUM(jk.jumlah_kegiatan), 0)
                    FROM jumlah_kegiatan jk
                    WHERE jk.user_id = users.user_id
                )
            `.as('totalJumlahKegiatan'),
        },
        where: ((users, { eq }) => eq(users.role, sql.placeholder('role')))
    }).prepare()

    return await prepared.execute({ role })
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
                userId: sql`${jumlahKegiatan.userId}`,
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