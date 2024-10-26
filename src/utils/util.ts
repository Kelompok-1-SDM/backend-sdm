import { promises as fs } from 'fs';
import path from 'path';

/**
 * Load secret from Docker secret path
 * @param secretKeyEnv - The environment variable that holds the secret key
 * @param defaultPath - Optional default path for Docker secrets, defaults to `/run/secrets/`
 * @returns Secret value as a string, or throws an error if not found
 */
export async function loadDockerSecret(secretKeyEnv: string, defaultPath: string = '/run/secrets/'): Promise<string> {
    const secretKey = process.env[secretKeyEnv];

    if (!secretKey) {
        throw new Error(`Environment variable ${secretKeyEnv} is not set`);
    }

    const secretFilePath = path.join(defaultPath, secretKey);

    try {
        const secret = await fs.readFile(secretFilePath, 'utf8');
        return secret.trim(); // Trim to remove any unwanted newline characters
    } catch (err: any) {
        throw new Error(`Failed to load secret from ${secretFilePath}: ${err.message}`);
    }
}
