import { drizzle } from 'drizzle-orm/mysql2';
import {
    users, kompetensis, kegiatans, usersToKompetensis, usersToKegiatans,
    jumlahKegiatan, lampiranKegiatans, agendaKegiatans, kompetensisToKegiatans,
    progressAgenda, progressAttachments, progressAgendaToProgressAttachment,
    jabatanAnggota,
    agendaToUsersKegiatans
} from './schema';
import { faker } from '@faker-js/faker';
import mysql from "mysql2/promise";
import { dbCredentials } from '../../drizzle.config';
import { exit } from 'process';
import { and, eq, sql } from 'drizzle-orm';

import * as xlsx from 'xlsx';
import { hashPassword } from '../utils/utils';
import mongoose from 'mongoose';
import { ChatRoom, Message } from '../models/livechatModels';
import { init } from '@paralleldrive/cuid2';

const poolConnection = mysql.createPool(dbCredentials);
const createId = init({ length: 24, fingerprint: process.env.CUID_FINGERPINT });

const db = drizzle({ client: poolConnection, casing: 'snake_case' });

// Define a type for rows with NIP and Nama (columns can vary)
type DosenRow = [number | undefined, string | number | undefined, string | number | undefined, string | undefined];
type KaryawanRow = [number | undefined, string | undefined, string | number | undefined];

// Function to extract data from Excel sheet
const extractDataFromExcel = (filePath: string, sheetName: string, role: 'admin' | 'manajemen' | 'dosen') => {
    // Read the Excel file
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[sheetName];

    // Convert the sheet data to JSON
    const jsonData = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1 });

    let nipNamaData;

    // Handle extraction differently for each sheet
    if (sheetName === 'DOSEN') {
        // Extract for DOSEN (NIP in column 1, Nama in column 3)
        nipNamaData = jsonData
            .slice(1)  // Skip header row
            .filter((row): row is DosenRow => !!row[1] && !!row[3])  // Ensure NIP and Nama are present
            .map(row => ({
                nip: row[1]!.toString(),  // NIP in column 1
                nama: row[3]!,  // Nama in column 3
                role: role,  // Assign the dosen role
            }));
    } else if (sheetName === 'KARYAWAN') {
        // Extract for KARYAWAN (Nama in column 2, NIP in column 3)
        nipNamaData = jsonData
            .slice(1)  // Skip header row
            .filter((row): row is KaryawanRow => !!row[2] && !!row[1])  // Ensure NIP and Nama are present
            .map(row => ({
                nip: row[2]!.toString(),  // NIP in column 3
                nama: row[1]!,  // Nama in column 2
                role: role,  // Assign the manajemen role initially
            }));
    }

    return nipNamaData || [];
};

// Updated seed function that uses extracted data
const seedUsers = async () => {
    // Extract data from both sheets
    const dosenData = extractDataFromExcel("data dosen_pbl SIB.xlsx", 'DOSEN', 'dosen');
    let karyawanData = extractDataFromExcel("data dosen_pbl SIB.xlsx", 'KARYAWAN', 'manajemen');

    // Randomly select three KARYAWAN entries to be admins
    const adminIndexes = faker.helpers.uniqueArray(() => faker.number.int({ min: 0, max: karyawanData.length - 1 }), 3);
    adminIndexes.forEach(index => karyawanData[index].role = 'admin');

    // Combine the two data sets
    const allUserData = [...dosenData, ...karyawanData];

    // Generate additional data like email, profile image, and password using faker
    let emailRand: Array<string> = faker.helpers.uniqueArray(faker.internet.email, allUserData.length);

    const userSeeds = await Promise.all(allUserData.map(async ({ nip, nama, role }) => ({
        nip: nip.trim(),  // Use extracted NIP
        nama: nama,  // Use extracted Nama
        email: emailRand.pop()!.toString(),
        role: role as 'admin' | 'manajemen' | 'dosen',  // Use the assigned role (dosen, manajemen, or admin)
        profileImage: faker.image.avatar(),
        password: await hashPassword(nip.trim()),
    })));

    // Insert the data into the database
    await db.insert(users).values(userSeeds);
    console.log(`Seeded ${userSeeds.length} users from Excel data`);
};

// Seed for 'kompetensis' table
const seedKompetensis = async () => {
    const kompetensiSeeds = Array.from({ length: 30 }).map(() => ({
        namaKompetensi: `${faker.internet.emoji({ types: ['object', 'symbol'] })} ${faker.lorem.words(1)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
    }));

    await db.insert(kompetensis).values(kompetensiSeeds);
    console.log(`Seeded ${kompetensiSeeds.length} kompetensis`);
};

// Seed for 'jabatan' table
const seedJabatan = async () => {
    const jabatanSeeds = Array.from({ length: 5 }).map(() => ({
        namaJabatan: faker.lorem.words(1),
        isPic: faker.helpers.arrayElement([true, false])
    }));

    await db.insert(jabatanAnggota).values(jabatanSeeds)
    console.log(`Seeded ${jabatanSeeds.length} jabatan`)
}

// Seed for 'kegiatans' table
const seedKegiatans = async () => {
    // Seed 20 kegiatan records
    const kegiatanSeeds = Array.from({ length: 20 }).map(() => ({
        judul: faker.lorem.sentence(),
        tanggalMulai: faker.date.past(),
        tanggalAkhir: faker.date.soon(),
        tipeKegiatan: faker.helpers.arrayElement(['jti', 'non-jti']),
        deskripsi: faker.lorem.paragraph(),
        lokasi: faker.location.city(),
        createdAt: new Date(),
        updatedAt: new Date(),
    }));

    // Insert kegiatan records and get their IDs
    const insertedKegiatanIds = await db.insert(kegiatans).values(kegiatanSeeds).$returningId();

    // Fetch all kompetensi records for random selection
    const kompetensiRecords = await db.select().from(kompetensis);

    // For each kegiatan, assign random kompetensis
    await Promise.all(insertedKegiatanIds.map(async (kegiatanId: any) => {
        const apa = new ChatRoom({
            roomId: kegiatanId.kegiatanId, // Using activityId as roomId
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        await apa.save()

        const kompetensiCount = faker.number.int({ min: 1, max: 20 });
        const assignedKompetensis = new Set();

        while (assignedKompetensis.size < kompetensiCount) {
            const randomKompetensiId = faker.helpers.arrayElement(kompetensiRecords).kompetensiId;

            if (!assignedKompetensis.has(randomKompetensiId)) {
                await db.insert(kompetensisToKegiatans).values({
                    kegiatanId: kegiatanId.kegiatanId,
                    kompetensiId: randomKompetensiId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                assignedKompetensis.add(randomKompetensiId);
            }
        }
    }));

    console.log(`Seeded ${kegiatanSeeds.length} kegiatans with kompetensi relationships`);
};

const seedUsersToKompetensis = async () => {
    const userRecords = await db.select().from(users);
    const kompetensiRecords = await db.select().from(kompetensis);

    for (const user of userRecords) {
        // Randomize the number of kompetensis to assign to this user
        if (user.role != 'dosen') {
            continue
        }
        const kompetensiCount = faker.number.int({ min: 1, max: 20 });
        const assignedKompetensis = new Set();

        while (assignedKompetensis.size < kompetensiCount) {
            const randomKompetensi = faker.helpers.arrayElement(kompetensiRecords).kompetensiId;

            // Ensure the kompetensi isn't assigned multiple times for the same user
            if (!assignedKompetensis.has(randomKompetensi)) {
                const existingRecord = await db
                    .select()
                    .from(usersToKompetensis)
                    .where(and(
                        eq(usersToKompetensis.userId, user.userId),
                        eq(usersToKompetensis.kompetensiId, randomKompetensi)
                    ));

                if (existingRecord.length === 0) {
                    await db.insert(usersToKompetensis).values({
                        userId: user.userId,
                        kompetensiId: randomKompetensi,
                    });
                }

                // Track the kompetensi assigned to avoid duplicates
                assignedKompetensis.add(randomKompetensi);
            }
        }
    }
    console.log(`Seeded usersToKompetensis`);
};


// Seed for 'usersToKegiatans' junction table
const seedUsersToKegiatans = async () => {
    const userRecords = await db.select().from(users);
    const kegiatanRecords = await db.select().from(kegiatans);
    const jabatanRecords = await db.select().from(jabatanAnggota);

    for (const user of userRecords) {
        if (user.role != 'dosen') {
            continue
        }
        // Randomize the number of kegiatans to assign to this user
        const kegiatanCount = faker.number.int({ min: 1, max: kegiatanRecords.length });
        const assignedKegiatans = new Set();

        while (assignedKegiatans.size < kegiatanCount) {
            const randomKegiatan = faker.helpers.arrayElement(kegiatanRecords);
            const randomJabatan = faker.helpers.arrayElement(jabatanRecords)

            // Ensure the kegiatan isn't assigned multiple times for the same user
            if (!assignedKegiatans.has(randomKegiatan)) {
                const existingRecord = await db
                    .select()
                    .from(usersToKegiatans)
                    .where(and(
                        eq(usersToKegiatans.userId, user.userId),
                        eq(usersToKegiatans.kegiatanId, randomKegiatan.kegiatanId)
                    ));

                if (existingRecord.length === 0) {
                    const status = faker.helpers.arrayElement(['ditugaskan', 'selesai'])
                    await db.insert(usersToKegiatans).values({
                        userId: user.userId,
                        kegiatanId: randomKegiatan.kegiatanId,
                        jabatanId: randomJabatan.jabatanId,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });

                    // Add user to the ChatRoom if not already added
                    const chatRoom = await ChatRoom.findOne({ roomId: randomKegiatan.kegiatanId });
                    if (chatRoom && !chatRoom.assignedUsers?.includes(user.userId)) {
                        chatRoom.assignedUsers!.push(user.userId);
                        await chatRoom.save();

                        // Create random live chat messages
                        const messageCount = 2;
                        for (let i = 0; i < messageCount; i++) {
                            const hasAttachment = faker.datatype.boolean();
                            const attachments = hasAttachment
                                ? [
                                    {
                                        filename: faker.system.fileName(),
                                        url: faker.internet.url(),
                                        type: faker.system.fileExt(),
                                    },
                                ]
                                : [];
                            await Message.create({
                                roomId: chatRoom.roomId,
                                senderId: user.userId,
                                message: faker.lorem.sentence(),
                                createdAt: new Date(),
                                updatedAt: new Date(),
                                attachments,
                            });
                        }
                    }

                    const apa = await db.select().from(kompetensisToKegiatans).where(eq(kompetensisToKegiatans.kegiatanId, randomKegiatan.kegiatanId))
                    const newListKompetensi = apa.map((asd) => {
                        return asd.kompetensiId
                    })
                    if (status == 'selesai') {
                        for (const element of newListKompetensi) {
                            await db.insert(usersToKompetensis).values({
                                userId: user.userId,
                                kompetensiId: element
                            }).onDuplicateKeyUpdate({
                                set: {
                                    userId: sql`user_id`
                                }
                            })
                        }

                        await db.insert(jumlahKegiatan)
                            .values({
                                userId: user.userId,
                                year: randomKegiatan.tanggalMulai!.getFullYear(),
                                month: randomKegiatan.tanggalMulai!.getMonth(),
                                jumlahKegiatan: 1,
                            }).onDuplicateKeyUpdate({
                                set: {
                                    jumlahKegiatan: sql`${jumlahKegiatan.jumlahKegiatan} + 1`
                                }
                            })
                    }
                }

                // Track the kegiatan assigned to avoid duplicates
                assignedKegiatans.add(randomKegiatan);
            }
        }
    }
    console.log(`Seeded usersToKegiatans`);
};


// Seed for 'lampiranKegiatans' table
const seedLampiranKegiatans = async () => {
    const kegiatanRecords = await db.select().from(kegiatans);
    const lampiranSeeds = [];

    for (const kegiatan of kegiatanRecords) {
        // Random number of lampirans for each kegiatan
        const lampiranCount = faker.number.int({ min: 1, max: 5 });

        for (let i = 0; i < lampiranCount; i++) {
            lampiranSeeds.push({
                kegiatanId: kegiatan.kegiatanId,
                nama: faker.lorem.words(2),
                url: faker.internet.url(),
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
    }

    // Insert all lampiran records in bulk
    await db.insert(lampiranKegiatans).values(lampiranSeeds);
    console.log(`Seeded ${lampiranSeeds.length} lampiran kegiatans`);
};


// Seed for 'agendaKegiatans' table
// Seed for 'agendaKegiatans' table
const seedAgendaKegiatans = async () => {
    const kegiatanRecords = await db.select().from(kegiatans);
    const userToKegiatanRecords = await db.select().from(usersToKegiatans);

    const agendaSeeds = [];
    const userToAgendaSeeds = [];

    for (const kegiatan of kegiatanRecords) {
        // Randomize the number of agendas for each kegiatan
        const agendaCount = faker.number.int({ min: 1, max: 5 });

        for (let i = 0; i < agendaCount; i++) {
            const agendaId = createId(); // Generate unique ID for each agenda
            agendaSeeds.push({
                agendaId,
                kegiatanId: kegiatan.kegiatanId,
                jadwalAgenda: faker.date.future(),
                namaAgenda: faker.lorem.sentence(),
                deskripsiAgenda: faker.lorem.paragraph(),
                isDone: faker.datatype.boolean(),
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            // Assign users linked to the kegiatan to this agenda
            const relatedUsers = userToKegiatanRecords.filter(
                (utk) => utk.kegiatanId === kegiatan.kegiatanId
            );

            for (const user of relatedUsers) {
                userToAgendaSeeds.push({
                    agendaId,
                    userKegiatanId: user.userToKegiatanId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
        }
    }

    // Bulk insert all agenda records
    await db.insert(agendaKegiatans).values(agendaSeeds);
    console.log(`Seeded ${agendaSeeds.length} agenda kegiatans`);

    // Bulk insert user-to-agenda assignments
    if (userToAgendaSeeds.length > 0) {
        await db.insert(agendaToUsersKegiatans).values(userToAgendaSeeds); // Update to correct user-to-agenda table if needed
        console.log(`Assigned ${userToAgendaSeeds.length} users to agenda kegiatans`);
    }
};



const seedAgendaProgressAndAttachments = async () => {
    const agendaRecords = await db.select().from(agendaKegiatans);
    const allProgressSeeds = [];
    const allAttachmentSeeds = [];
    const allProgressToAttachments = [];

    for (const agenda of agendaRecords) {
        // Random number of progress entries for each agenda
        const progressCount = faker.number.int({ min: 1, max: 5 });

        for (let i = 0; i < progressCount; i++) {
            const progressId = createId(); // Use UUIDs for unique progress IDs
            const createdAt = new Date();
            const updatedAt = new Date();

            // Add progress entry
            allProgressSeeds.push({
                progressId,
                agendaId: agenda.agendaId,
                deskripsiProgress: faker.lorem.paragraph(),
                createdAt,
                updatedAt,
            });

            // Random number of attachments for each progress
            const attachmentCount = faker.number.int({ min: 1, max: 3 });
            const assignedAttachmentIds = new Set();

            for (let j = 0; j < attachmentCount; j++) {
                const attachmentId = createId(); // Unique UUID for each attachment

                // Avoid duplicate attachments for this progress
                if (!assignedAttachmentIds.has(attachmentId)) {
                    // Add attachment entry
                    allAttachmentSeeds.push({
                        attachmentId,
                        hash: attachmentId, // Assuming hash is the same as the unique ID
                        url: faker.internet.url(),
                        createdAt,
                        updatedAt,
                    });

                    // Add progress-to-attachment relationship
                    allProgressToAttachments.push({
                        progressId,
                        attachmentId,
                    });

                    assignedAttachmentIds.add(attachmentId);
                }
            }
        }
    }

    // Insert all progress entries in bulk
    await db.insert(progressAgenda).values(allProgressSeeds);
    console.log(`Seeded ${allProgressSeeds.length} progress records`);

    // Insert all attachments in bulk
    await db.insert(progressAttachments).values(allAttachmentSeeds);
    console.log(`Seeded ${allAttachmentSeeds.length} attachment records`);

    // Insert all progress-to-attachment relationships in bulk
    await db.insert(progressAgendaToProgressAttachment).values(allProgressToAttachments);
    console.log(`Seeded ${allProgressToAttachments.length} progress-to-attachment relationships`);
};


// Main function to run all seeders
const runSeeds = async () => {
    mongoose.connect(process.env.MONGODB_URI!
    )
        .then(() => console.log('MongoDB connected'))
        .catch((err) => console.log(err));

    await seedUsers();
    await seedKompetensis();
    await seedJabatan();
    await seedKegiatans();
    await seedUsersToKegiatans();
    await seedLampiranKegiatans();
    await seedAgendaKegiatans();
    await seedUsersToKompetensis();
    await seedAgendaProgressAndAttachments()
    console.log('All seed data inserted');
    exit()
};

runSeeds().catch((err) => {
    console.error('Error seeding data:', err);
});
