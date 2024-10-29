import { UserDataType } from "../models/usersModels";
import { hashPassword } from "../utils/utils";
import * as usersModels from "../models/usersModels";
import { login } from "../services/tokenService";

export async function createUser(data: UserDataType) {
    data.password = await hashPassword(data.password)

    const user = await usersModels.createUser(data)
    return user
}

export async function fetchAllUsers() {
    return await usersModels.fetchAllUser()
}