import { generateToken } from "../utils/jwt";
import { verify } from "argon2";
import { fetchUserForAuth } from "../models/usersModels";

export async function login(nip: string, passwordUser: string) {
    const user = await fetchUserForAuth(nip);

    if (!user) return "user_is_not_found";

    const { password, ...rest } = user

    const wasMatch = await verify(password, passwordUser)
    if (!wasMatch) return "wrong_password";

    const token = await generateToken(user.userId);

    return { ...rest, token }
}