import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { createResponse } from "../utils/utils";
import * as userService from '../services/usersServices'

export async function fetchUsers(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json(createResponse(
            false,
            null,
            "Input error",
            errors.array()
        ));
        return
    }

    let { uid, role, nip } = req.query
    try {
        let data: any

        if (uid) {
            data = await userService.fetchUser(uid as string)
        } else if (nip) {
            data = await userService.fetchUser(undefined, nip as string)
        } else if (role) {
            data = await userService.fetchUserByRole(role as 'admin' | 'manajemen' | 'dosen')
        } else {
            data = await userService.fetchAllUsers()
        }

        if (data === "user_is_not_found") {
            res.status(404).json(createResponse(false, null, "User not found"))
            return
        }

        res.status(200).json(createResponse(
            true,
            data,
            "OK"
        ));
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json(createResponse(
                false,
                process.env.NODE_ENV === 'development' ? err.stack : undefined,
                err.message || 'An unknown error occurred!'
            ))
            return
        }

        console.log(err)
        res.status(500).json(createResponse(
            false,
            null,
            "Mbuh mas"
        ))
    }
}

export async function fetchDosenHomepage(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json(createResponse(
            false,
            null,
            "Input error",
            errors.array()
        ));
        return
    }

    let { uid: uidUser } = req.query
    try {

        const data = await userService.homePageMobile(uidUser as string)

        if (data === "user_is_not_found") {
            res.status(404).json(createResponse(false, null, "User not found"))
            return
        }

        res.status(200).json(createResponse(
            true,
            data,
            "OK"
        ));
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json(createResponse(
                false,
                process.env.NODE_ENV === 'development' ? err.stack : undefined,
                err.message || 'An unknown error occurred!'
            ))
            return
        }

        console.log(err)
        res.status(500).json(createResponse(
            false,
            null,
            "Mbuh mas"
        ))
    }
}

export async function fetchUserStatistic(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json(createResponse(
            false,
            null,
            "Input error",
            errors.array()
        ));
        return
    }

    let { uid: uidUser, year } = req.query
    try {

        const data = await userService.statistic(uidUser as string, Number(year))

        if (data === "user_is_not_found") {
            res.status(404).json(createResponse(false, null, "User not found"))
            return
        }

        res.status(200).json(createResponse(
            true,
            data,
            "OK"
        ));
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json(createResponse(
                false,
                process.env.NODE_ENV === 'development' ? err.stack : undefined,
                err.message || 'An unknown error occurred!'
            ))
            return
        }

        console.log(err)
        res.status(500).json(createResponse(
            false,
            null,
            "Mbuh mas"
        ))
    }
}

export async function createUser(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json(createResponse(
            false,
            null,
            "Input error",
            errors.array()
        ));
        return
    }

    const { nip, password, nama, role, email } = req.body
    const file = req.file as Express.Multer.File;

    try {
        const data = await userService.createUser({ nip, password, nama, role, email }, file)
        res.status(200).json(createResponse(
            true,
            data,
            "OK"
        ));
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json(createResponse(
                false,
                process.env.NODE_ENV === 'development' ? err.stack : undefined,
                err.message || 'An unknown error occurred!'
            ))
            return
        }

        console.log(err)
        res.status(500).json(createResponse(
            false,
            null,
            "Mbuh mas"
        ))
    }
};

export async function addUserKompetensi(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json(createResponse(
            false,
            null,
            "Input error",
            errors.array()
        ));
        return
    }

    const { list_kompetensi: listKompetensi } = req.body
    const { uid: uidUser } = req.query

    try {
        const data = await userService.addUserKompetensi(uidUser as string, listKompetensi)
        res.status(200).json(createResponse(
            true,
            data,
            "OK"
        ));
    } catch (err) {
        if (err instanceof Error) {
            if (err.message.toLowerCase().includes('references `users`')) {
                res.status(404).json(createResponse(
                    false,
                    null,
                    "One of user uid of not found, bad relationship"
                ))
                return
            } else if (err.message.toLowerCase().includes('references `kompetensi`')) {
                res.status(404).json(createResponse(
                    false,
                    null,
                    "Kompetensi uid was not found, bad relationship"
                ))
                return
            } else {
                res.status(500).json(createResponse(
                    false,
                    process.env.NODE_ENV === 'development' ? err.stack : undefined,
                    err.message || 'An unknown error occurred!'
                ))
                return
            }
        }

        console.log(err)
        res.status(500).json(createResponse(
            false,
            null,
            "Mbuh mas"
        ))
    }
};

export async function updateUser(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json(createResponse(
            false,
            null,
            "Input error",
            errors.array()
        ));
        return
    }

    const { nip, password, nama, role } = req.body
    const { uid } = req.query
    const file = req.file as Express.Multer.File;

    if (req.user!.role !== 'admin' && req.user!.userId !== uid as string) {
        res.status(401).json(createResponse(
            false,
            null,
            "You're not allowed to do this"
        ));
        return
    }

    try {
        const data = await userService.updateUser(uid as string, { nip, password, nama, role, }, file)

        if (data === "user_is_not_found") {
            res.status(404).json(createResponse(false, null, "User not found"))
            return
        }

        res.status(200).json(createResponse(
            true,
            data,
            "OK"
        ));
    } catch (err) {
        if (err instanceof Error) {
            if (err.message.toLowerCase().includes('duplicate')) {
                res.status(422).json(createResponse(
                    false,
                    undefined,
                    "NIP or email is duplicated"
                ))
                return
            } else {
                res.status(500).json(createResponse(
                    false,
                    process.env.NODE_ENV === 'development' ? err.stack : undefined,
                    err.message || 'An unknown error occurred!'
                ))
                return
            }
        }

        console.log(err)
        res.status(500).json(createResponse(
            false,
            null,
            "Mbuh mas"
        ))
    }
}

export async function deleteUser(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json(createResponse(
            false,
            null,
            "Input error",
            errors.array()
        ));
        return
    }

    const { uid } = req.query

    try {
        const data = await userService.deleteUser(uid as string)
        if (data === "user_is_not_found") {
            res.status(404).json(createResponse(false, null, "User not found"))
            return
        }

        res.status(200).json(createResponse(
            true,
            data,
            "OK"
        ));
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json(createResponse(
                false,
                process.env.NODE_ENV === 'development' ? err.stack : undefined,
                err.message || 'An unknown error occurred!'
            ))
            return
        }

        console.log(err)
        res.status(500).json(createResponse(
            false,
            null,
            "Mbuh mas"
        ))
    }
}

export async function deleteUserKompetensi(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json(createResponse(
            false,
            null,
            "Input error",
            errors.array()
        ));
        return
    }

    const { list_kompetensi: listKompetensi } = req.body
    const { uid } = req.query

    try {
        const data = await userService.deleteUserKompetensi(uid as string, listKompetensi)
        if (data === "user_is_not_found") {
            res.status(404).json(createResponse(false, null, "User not found"))
            return
        }

        res.status(200).json(createResponse(
            true,
            data,
            "OK"
        ));
    } catch (err) {
        if (err instanceof Error) {
            res.status(500).json(createResponse(
                false,
                process.env.NODE_ENV === 'development' ? err.stack : null,
                err.message || 'An unknown error occurred!'
            ))
            return
        }

        console.log(err)
        res.status(500).json(createResponse(
            false,
            null,
            "Mbuh mas"
        ))
    }
}

// export async function deleteUserJumlahKegiatan(req: Request, res: Response) {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         res.status(400).json(createResponse(
//             false,
//             null,
//             "Input error",
//             errors.array()
//         ));
//         return
//     }

//     const { year, month } = req.body
//     const { uid } = req.query

//     try {
//         const data = await userService.deleteUserJumlahKegiatan(uid as string, Number(year), Number(month))
//         if (data === "user_is_not_found") {
//             res.status(404).json(createResponse(false, null, "User not found"))
//             return
//         }

//         res.status(200).json(createResponse(
//             true,
//             data,
//             "OK"
//         ));
//     } catch (err) {
//         if (err instanceof Error) {
//             res.status(500).json(createResponse(
//                 false,
//                 process.env.NODE_ENV === 'development' ? err.stack : undefined,
//                 err.message || 'An unknown error occurred!'
//             ))
//             return
//         }

//         console.log(err)
//         res.status(500).json(createResponse(
//             false,
//             undefined,
//             "Mbuh mas"
//         ))
//     }
// }