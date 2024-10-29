import { createSigner, createVerifier } from 'fast-jwt';

export const generateToken = (userId: string, role: string): string => {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN;

    if (!secret || !expiresIn) {
        throw new Error('JWT secret or expiration time not set');
    }

    const signSync = createSigner({ key: secret, expiresIn })
    return signSync({ userId, role})
};

export const verifyToken = (token: string): any => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('JWT secret not set');
    }

    const verifySync = createVerifier({ key: secret, cache: true })
    return verifySync(token);
};
