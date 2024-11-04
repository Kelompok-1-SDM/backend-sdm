import { generateToken } from "../utils/jwt";
import { verify } from "argon2";
import { fetchUserForAuth } from "../models/usersModels";

export async function login(nip: string, password: string) {
    const user = await fetchUserForAuth(nip);

    if (!user) return "user_is_not_found";

    const wasMatch = await verify(user.password, password)
    if (!wasMatch) return "wrong_password";

    const token = await generateToken(user.userId);

    return token 
}