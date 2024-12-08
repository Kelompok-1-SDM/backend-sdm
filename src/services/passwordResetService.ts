import crypto from 'crypto';
import { fetchUserForAuth, updateUserPassword } from '../models/usersModels';
import { generateResetToken } from './utilsService';
import { createResetToken, deleteResetToken, findResetToken } from '../models/passwordReset';
import { sendPasswordResetEmail } from '../utils/email';
import { hashPassword } from '../utils/utils';

export async function requestPasswordReset(nip: string) {
    const user = await fetchUserForAuth(nip);
    if (!user) return null;

    const { token, hash, expiresAt } = generateResetToken();
    await createResetToken(user.userId, hash, expiresAt);
    await sendPasswordResetEmail(user.email as string, token);

    return true;
}

export async function validateResetToken(token: string) {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const resetRecord = await findResetToken(hash);
    return resetRecord ? resetRecord.userId : null;
}

export async function resetPassword(userId: string, newPassword: string) {
    newPassword = await hashPassword(newPassword)

    await updateUserPassword(userId, newPassword);
    await deleteResetToken(userId);
}
