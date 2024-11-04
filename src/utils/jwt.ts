import { createSigner, createVerifier } from 'fast-jwt';

export const generateToken = async (userId: string): Promise<string> => {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN;

    if (!secret || !expiresIn) {
        throw new Error('JWT secret or expiration time not set');
    }

    const signWithPromise = createSigner({ key: async () => secret, expiresIn })
    return await signWithPromise({ userId })
};

export const verifyToken = async (token: string): Promise<any> => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('JWT secret not set');
    }

    const verifyWithPromise = createVerifier({ key: async () => secret, cache: true })
    return await verifyWithPromise(token);
};
