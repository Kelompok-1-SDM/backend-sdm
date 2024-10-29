import { Request, Response, NextFunction } from 'express';
import { TokenError } from 'fast-jwt';
import { verifyToken } from '../utils/jwt';
import { createResponse } from '../utils/utils';


const authorize = (requiredRoles: 'admin' | 'manajemen' | 'dosen') => {
    return (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json(createResponse(
                false,
                null,
                "Unauthorized"
            ));
        } // Unauthorized if no token is present

        try {
            const { userId, role } = verifyToken(token);

            // Check if the user has one of the required roles
            if (!requiredRoles.includes(role)) {
                return res.status(403).json(createResponse(
                    false,
                    null,
                    "Yo're not allowed to use this method"
                )); // Forbidden if the role is not in required roles
            }

            // Optionally attach user info to request object
            req.user = { userId, role };
            next();
        } catch (error) {
            if (error instanceof TokenError && error.code == TokenError.codes.expired) {
                return res.status(401).json(createResponse(
                    false,
                    null,
                    "Access Token is expired, login maneh"
                )); // Unauthorized if no token is present
            }
            return `Embuh mas. ${error as string}`
        }
    };
};

export default authorize;
