import { drizzle } from 'drizzle-orm/mysql2';
import {
    users, kompetensis, kegiatans, usersToKompetensis, usersToKegiatans,
    jumlahKegiatan, lampiranKegiatans, agendaKegiatans, groupsMessages,
    messagesAttachment, messagesToAttachments, kompetensisToKegiatans,
    progressAgenda,
    progressAttachments,
    progressAgendaToProgressAttachment
} from './schema';
import { faker } from '@faker-js/faker';
import mysql from "mysql2/promise";
import { dbCredentials } from '../../drizzle.config';
import { exit } from 'process';
import { and, eq } from 'drizzle-orm';

const poolConnection = mysql.createPool(dbCredentials);

const db = drizzle({ client: poolConnection, casing: 'snake_case' });

// Seed for 'users' table
const seedUsers = async () => {
    let nipRand: Array<string> = faker.helpers.uniqueArray(() => { return faker.phone.number({ style: 'human' }) }, 15);
    let emailRand: Array<string> = faker.helpers.uniqueArray(faker.internet.email, 15);
    const userSeeds = Array.from({ length: 15 }).map(() => ({
        nip: nipRand.pop()!.toString(),
        nama: faker.person.fullName(),
        email: emailRand.pop()!.toString(),
        role: faker.helpers.arrayElement(['admin', 'manajemen', 'dosen']),
        profileImage: faker.image.avatar(),
        password: faker.internet.password(),
    }));

    await db.insert(users).values(userSeeds);
    console.log(`Seeded ${userSeeds.length} users`);
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


// Seed for 'groupsMessages' table
const seedGroupsMessages = async () => {
    const kegiatanRecords = await db.select().from(kegiatans);
    const userRecords = await db.select().from(users);

    const groupMessageSeeds = Array.from({ length: 20 }).map(() => ({
        kegiatanId: faker.helpers.arrayElement(kegiatanRecords).kegiatanId,
        userId: faker.helpers.arrayElement(userRecords).userId,
        text: faker.lorem.paragraph(),
        createdAt: new Date(),
        updatedAt: new Date(),
    }));

    await db.insert(groupsMessages).values(groupMessageSeeds);
    console.log(`Seeded ${groupMessageSeeds.length} group messages`);
};

// Seed for 'messagesAttachment' table
const seedMessagesAttachment = async () => {
    const attachmentSeeds = Array.from({ length: 10 }).map(() => ({
        hash: faker.string.uuid(),
        url: faker.internet.url(),
        createdAt: new Date(),
        updatedAt: new Date(),
    }));

    await db.insert(messagesAttachment).values(attachmentSeeds);
    console.log(`Seeded ${attachmentSeeds.length} message attachments`);
};

// Seed for 'messagesToAttachments' junction table
const seedMessagesToAttachments = async () => {
    const messageRecords = await db.select().from(groupsMessages);
    const attachmentRecords = await db.select().from(messagesAttachment);

    for (let i = 0; i < 15; i++) {
        const messagesId = faker.helpers.arrayElement(messageRecords).messagesId;
        const attachmentId = faker.helpers.arrayElement(attachmentRecords).attachmentId;

        // Check if the relationship already exists
        const existingRecord = await db
            .select()
            .from(messagesToAttachments)
            .where(and(
                eq(messagesToAttachments.messagesId, messagesId),
            ));
        if (existingRecord.length === 0) {
            await db.insert(messagesToAttachments).values({
                messagesId,
                attachmentId,
            });
        }
    }
    console.log(`Seeded messagesToAttachments`);
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
    await seedGroupsMessages();
    await seedMessagesAttachment();
    await seedKompetensiToKegiatans();
    await seedUsersToKompetensis();
    await seedUsersToKegiatans();
    await seedMessagesToAttachments();
    await seedProgressToAttachments();
    console.log('All seed data inserted');
    exit()
};

runSeeds().catch((err) => {
    console.error('Error seeding data:', err);
});
