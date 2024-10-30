import { Request, Response, NextFunction } from 'express';
import { TokenError } from 'fast-jwt';
import { verifyToken } from '../utils/jwt';
import { createResponse } from '../utils/utils';


const authorize = (requiredRoles: ('admin' | 'manajemen' | 'dosen')[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
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
            const { userId, role } = verifyToken(token);

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
            }

            // Handle other errors
            res.status(500).json(createResponse(
                false,
                null,
                `An error occurred: ${error instanceof Error ? error.message : String(error)}`
            ));
            return
        }
    };
}

export default authorize;
