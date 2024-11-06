import { Request, Response, NextFunction } from 'express';
import { TokenError } from 'fast-jwt';
import { verifyToken } from '../utils/jwt';
import { createResponse } from '../utils/utils';
import { fetchUserByUid } from '../models/usersModels';
import { Socket } from 'socket.io';


export const authorize = (requiredRoles: ('admin' | 'manajemen' | 'dosen')[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            res.status(401).json(createResponse(
                false,
                null,
                "Unauthorized"
            ));
            return
        } // Unauthorized if no token is present

        try {
            // Assuming verifyToken is async, use await
            const { userId } = await verifyToken(token);

            const ap = await fetchUserByUid(userId)

            if (!ap) {
                res.status(401).json(createResponse(
                    false,
                    null,
                    "User not found"
                ));
                return
            }

            const role = ap.role as 'admin' | 'manajemen' | 'dosen'

            // Check if the user's role matches the required roles
            if (!requiredRoles.includes(role)) {
                res.status(403).json(createResponse(
                    false,
                    null,
                    "You're not allowed to use this method"
                ));
                return
            }

            // Attach user info to request object
            req.user = { userId, role };
            next(); // Continue to the next middleware
        } catch (error) {
            // Handle token errors (like expired token)
            if (error instanceof TokenError && error.code == TokenError.codes.expired) {
                res.status(401).json(createResponse(
                    false,
                    null,
                    "Access Token is expired, please login again"
                ));
                return
            } else if (error instanceof Error) {
                res.status(500).json(createResponse(
                    false,
                    process.env.NODE_ENV === 'development' ? error.stack : null,
                    error.message || 'An unknown error occurred!'
                ))
                return
            }
            console.log(error)
            res.status(500).json(createResponse(
                false,
                null,
                "Mbuh mas"
            ))
        }
    };
}


export async function socketAuth(socket: Socket, next: (err?: Error) => void) {
    const token = socket.handshake.headers['authorization']?.split(" ")[1];
    if (!token) {
        return next(new Error(JSON.stringify(createResponse(
            false,
            null,
            "Unauthorized"
        ))));
    }

    try {
        const { userId } = await verifyToken(token);

        const user = await fetchUserByUid(userId);
        if (!user) {
            return next(new Error(JSON.stringify({ code: 404, message: 'Authentication error: User not found' })));
        }

        socket.data.user = { userId };
        next(); // Authentication succeeded, proceed
    } catch (err) {
        // Differentiate between errors (e.g., invalid token or other issues)
        if (err instanceof TokenError && err.code == TokenError.codes.expired) {
            next(new Error(JSON.stringify(createResponse(
                false,
                null,
                "Access Token is expired, please login again"
            ))))
        } else if (err instanceof Error) {
            next(new Error(JSON.stringify(createResponse(
                false,
                process.env.NODE_ENV === 'development' ? err.stack : null,
                err.message || 'An unknown error occurred!'
            ))))
            return
        }

        console.log(err)
        next(new Error(JSON.stringify(createResponse(
            false,
            null,
            "Mbuh mas"
        ))))
    }
}
