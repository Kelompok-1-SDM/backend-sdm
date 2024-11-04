import { drizzle } from 'drizzle-orm/mysql2';
import {
    users, kompetensis, kegiatans, usersToKompetensis, usersToKegiatans,
    jumlahKegiatan, lampiranKegiatans, agendaKegiatans, kompetensisToKegiatans,
    progressAgenda, progressAttachments, progressAgendaToProgressAttachment
} from './schema';
import { faker } from '@faker-js/faker';
import mysql from "mysql2/promise";
import { dbCredentials } from '../../drizzle.config';
import { exit } from 'process';
import { and, eq } from 'drizzle-orm';

import * as xlsx from 'xlsx';
import { hashPassword } from '../utils/utils';

const poolConnection = mysql.createPool(dbCredentials);

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
    const kompetensiSeeds = Array.from({ length: 10 }).map(() => ({
        namaKompetensi: `${faker.internet.emoji({ types: ['object', 'symbol'] })} ${faker.lorem.words(1)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
    }));

    await db.insert(kompetensis).values(kompetensiSeeds);
    console.log(`Seeded ${kompetensiSeeds.length} kompetensis`);
};

// Seed for 'kegiatans' table
const seedKegiatans = async () => {
    const kegiatanSeeds = Array.from({ length: 7 }).map(() => ({
        judulKegiatan: faker.lorem.sentence(),
        tanggal: faker.date.past(),
        lokasi: faker.location.city(),
        tipe_kegiatan: faker.helpers.arrayElement(['jti', 'non-jti']),
        deskripsi: faker.lorem.paragraph(),
        createdAt: new Date(),
        updatedAt: new Date(),
    }));

    await db.insert(kegiatans).values(kegiatanSeeds);
    console.log(`Seeded ${kegiatanSeeds.length} kegiatans`);
};

// Seed for 'usersToKompetensis' junction table
const seedUsersToKompetensis = async () => {
    const userRecords = await db.select().from(users);
    const kompetensiRecords = await db.select().from(kompetensis);

    for (let i = 0; i < 15; i++) {
        const userId = faker.helpers.arrayElement(userRecords).userId;
        const kompetensiId = faker.helpers.arrayElement(kompetensiRecords).kompetensiId;

        // Check if the relationship already exists
        const existingRecord = await db
            .select()
            .from(usersToKompetensis)
            .where(and(
                eq(usersToKompetensis.userId, userId),
                eq(usersToKompetensis.kompetensiId, kompetensiId)
            ));

        if (existingRecord.length === 0) {
            await db.insert(usersToKompetensis).values({
                userId: userId,
                kompetensiId: kompetensiId,
            });
        }
    }
    console.log(`Seeded usersToKompetensis`);
};

// Seed for 'usersToKegiatans' junction table
const seedUsersToKegiatans = async () => {
    const userRecords = await db.select().from(users);
    const kegiatanRecords = await db.select().from(kegiatans);

    for (let i = 0; i < 15; i++) {
        const userId = faker.helpers.arrayElement(userRecords).userId;
        const kegiatanId = faker.helpers.arrayElement(kegiatanRecords).kegiatanId;

        // Check if the relationship already exists
        const existingRecord = await db
            .select()
            .from(usersToKegiatans)
            .where(and(
                eq(usersToKegiatans.userId, userId),
                eq(usersToKegiatans.kegiatanId, kegiatanId)
            ));

        if (existingRecord.length === 0) {
            await db.insert(usersToKegiatans).values({
                userId,
                kegiatanId,
                status: faker.helpers.arrayElement(['ditugaskan', 'selesai']),
                roleKegiatan: faker.helpers.arrayElement(['pic', 'anggota']),
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
    }
    console.log(`Seeded usersToKegiatans`);
};

// Seed for 'jumlahKegiatan' table
const seedJumlahKegiatan = async () => {
    const userRecords = await db.select().from(users);

    const jumlahKegiatanSeeds = Array.from({ length: 15 }).map(() => ({
        userId: faker.helpers.arrayElement(userRecords).userId,
        year: faker.date.past().getFullYear(),
        month: faker.helpers.arrayElement([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
        jumlahKegiatan: faker.number.int({ min: 1, max: 10 }),
        createdAt: new Date(),
        updatedAt: new Date(),
    }));

    await db.insert(jumlahKegiatan).values(jumlahKegiatanSeeds);
    console.log(`Seeded ${jumlahKegiatanSeeds.length} jumlah kegiatan entries`);
};

// Seed for 'lampiranKegiatans' table
const seedLampiranKegiatans = async () => {
    const kegiatanRecords = await db.select().from(kegiatans);

    const lampiranSeeds = Array.from({ length: 10 }).map(() => ({
        kegiatanId: faker.helpers.arrayElement(kegiatanRecords).kegiatanId,
        nama: faker.lorem.words(2),
        url: faker.internet.url(),
        createdAt: new Date(),
        updatedAt: new Date(),
    }));

    await db.insert(lampiranKegiatans).values(lampiranSeeds);
    console.log(`Seeded ${lampiranSeeds.length} lampiran kegiatans`);
};

// Seed for 'agendaKegiatans' table
const seedAgendaKegiatans = async () => {
    const kegiatanRecords = await db.select().from(kegiatans);
    const userRecords = await db.select().from(users);

    const agendaSeeds = Array.from({ length: 10 }).map(() => ({
        kegiatanId: faker.helpers.arrayElement(kegiatanRecords).kegiatanId,
        userId: faker.helpers.arrayElement(userRecords).userId,
        jadwalAgenda: faker.date.future(),
        namaAgenda: faker.lorem.sentence(),
        deskripsiAgenda: faker.lorem.paragraph(),
        status: faker.helpers.arrayElement(['rencana', 'jalan', 'selesai']),
        createdAt: new Date(),
        updatedAt: new Date(),
    }));

    await db.insert(agendaKegiatans).values(agendaSeeds);
    console.log(`Seeded ${agendaSeeds.length} agenda kegiatans`);
};

// Seed for 'progressAgenda' table
const seedprogressAgenda = async () => {
    const agendaRecord = await db.select().from(agendaKegiatans);

    const progressSeed = Array.from({ length: 30 }).map(() => ({
        agendaId: faker.helpers.arrayElement(agendaRecord).agendaId,
        deskripsiProgress: faker.lorem.paragraph(),
        createdAt: new Date(),
        updatedAt: new Date(),
    }));

    await db.insert(progressAgenda).values(progressSeed);
    console.log(`Seeded ${progressSeed.length} agenda kegiatans`);
};

// Seed for 'progressAttachment' table
const seedProgressAttachment = async () => {
    const attachmentSeeds = Array.from({ length: 30 }).map(() => ({
        hash: faker.string.uuid(),
        url: faker.internet.url(),
        createdAt: new Date(),
        updatedAt: new Date(),
    }));

    await db.insert(progressAttachments).values(attachmentSeeds);
    console.log(`Seeded ${attachmentSeeds.length} message attachments`);
};

// Seed for 'progressToAttachments' junction table
const seedProgressToAttachments = async () => {
    const progressRecords = await db.select().from(progressAgenda);
    const attachmentRecords = await db.select().from(progressAttachments);

    for (let i = 0; i < 30; i++) {
        const progressId = faker.helpers.arrayElement(progressRecords).progressId;
        const attachmentId = faker.helpers.arrayElement(attachmentRecords).attachmentId;

        // Check if the relationship already exists
        const existingRecord = await db
            .select()
            .from(progressAgendaToProgressAttachment)
            .where(and(
                eq(progressAgendaToProgressAttachment.progressId, progressId),
            ));

        if (existingRecord.length === 0) {
            await db.insert(progressAgendaToProgressAttachment).values({
                progressId,
                attachmentId,
            });
        }
    }
    console.log(`Seeded progressToAttachments`);
};

// Seed for 'kompetensiToKegiatans' junction table
const seedKompetensiToKegiatans = async () => {
    const kompetensiRecords = await db.select().from(kompetensis);
    const kegiatanRecords = await db.select().from(kegiatans);

    for (let i = 0; i < 15; i++) {
        const kompetensiId = faker.helpers.arrayElement(kompetensiRecords).kompetensiId;
        const kegiatanId = faker.helpers.arrayElement(kegiatanRecords).kegiatanId;

        // Check if the relationship already exists
        const existingRecord = await db
            .select()
            .from(kompetensisToKegiatans)
            .where(and(
                eq(kompetensisToKegiatans.kompetensiId, kompetensiId),
                eq(kompetensisToKegiatans.kegiatanId, kegiatanId)
            ));

        if (existingRecord.length === 0) {
            await db.insert(kompetensisToKegiatans).values({
                kompetensiId,
                kegiatanId,
            });
        }
    }
    console.log(`Seeded kompetensiToKegiatans`);
};


// Main function to run all seeders
const runSeeds = async () => {
    await seedUsers();
    await seedKompetensis();
    await seedKegiatans();
    await seedJumlahKegiatan();
    await seedLampiranKegiatans();
    await seedAgendaKegiatans();
    await seedprogressAgenda();
    await seedProgressAttachment();
    await seedKompetensiToKegiatans();
    await seedUsersToKompetensis();
    await seedUsersToKegiatans();
    await seedProgressToAttachments();
    console.log('All seed data inserted');
    exit()
};

runSeeds().catch((err) => {
    console.error('Error seeding data:', err);
});
