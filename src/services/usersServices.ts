import { UserDataType } from "../models/usersModels";
import { hashPassword } from "../utils/utils";
import * as usersModels from "../models/usersModels";
import * as kegiatanModels from "../models/kegiatanModels"
import { calculateFileHash, uploadFileToCdn } from "./utilsService";

export async function homePageMobile(uidUser: string) {
    const temp = await usersModels.fetchUserByUid(uidUser)
    if (!temp) return "user_is_not_found"

    const jumlahBulanSkrg = await kegiatanModels.fetchJumlahKegiatanAkanDilaksanakanByUser(uidUser, new Date().getMonth() + 1)
    const duaTugasTerbaru = await kegiatanModels.fetchKegiatanByUser(uidUser, undefined, true)
    const tugasBerlangsung = await kegiatanModels.fetchUserCurrentKegiatan(uidUser, new Date())
    const stats = await statistic(uidUser)

    return {
        jumlahTugas: jumlahBulanSkrg,
        duaTugasTerbaru: duaTugasTerbaru.kegiatan,
        tugasBerlangsung,
        statistik: stats
    }
}

export async function statistic(uidUser: string, year: number = new Date().getFullYear()) {
    const temp = await usersModels.fetchUserByUid(uidUser)
    if (!temp) return "user_is_not_found"

    return await usersModels.fetchUserStatistic(uidUser, year)
}

export async function fetchAllUsers() {
    return await usersModels.fetchAllUser()
}

export async function fetchUserByRole(role: 'admin' | 'manajemen' | 'dosen') {
    return await usersModels.fetchUserByRole(role)
}

export async function fetchUser(uid: string) {
    const res = await usersModels.fetchUserComplete(uid)
    if (!res) return "user_is_not_found"

    return res
}

export async function createUser(data: UserDataType, file?: Express.Multer.File) {
    data.password = await hashPassword(data.password)

    if (file) {
        const hashFile = calculateFileHash(file.buffer)
        const fileUrl = await uploadFileToCdn(file, hashFile, 'profil')
        data.profileImage = fileUrl
    }

    return await usersModels.createUser(data)
}

export async function updateUser(uidUser: string, data: Partial<usersModels.UserDataType>, file?: Express.Multer.File) {
    const temp = await usersModels.fetchUserByUid(uidUser)
    if (!temp) return "user_is_not_found"

    if (data.password) data.password = await hashPassword(data.password)

    if (file) {
        const hashFile = calculateFileHash(file.buffer)
        const fileUrl = await uploadFileToCdn(file, hashFile, 'profil')
        data.profileImage = fileUrl
    }

    return await usersModels.updateUser(uidUser, data)
}

export async function deleteUser(uidUser: string) {
    const res = await usersModels.deleteUser(uidUser)
    if (!res) return "user_is_not_found"

    return res
}