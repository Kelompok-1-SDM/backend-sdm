import { UserDataType } from "../models/usersModels";
import { hashPassword } from "../utils/utils";
import * as usersModels from "../models/usersModels";

export async function fetchAllUsers() {
    return await usersModels.fetchAllUser()
}

export async function fetchUserByRole(role: 'admin' | 'manajemen' | 'dosen') {
    return await usersModels.fetchUserByRole(role)
}

export async function fetchUserComplete(uid: string) {
    return await usersModels.fetchUserComplete(uid)
}

export async function createUser(data: UserDataType) {
    data.password = await hashPassword(data.password)

    const user = await usersModels.createUser(data)
    return user
}

export async function updateUser(uidUser: string, data: Partial<usersModels.UserDataType>) {
    if (data.password) {
        data.password = await hashPassword(data.password)
    }
    return await usersModels.updateUser(uidUser, data)
}

export async function deleteUser(uidUser: string) {
    const res = await usersModels.deleteUser(uidUser)
    if (res.length !== 0) {
        return res
    }

    return "user_not_found"
}