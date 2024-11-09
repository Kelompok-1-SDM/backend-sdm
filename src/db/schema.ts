import { int, datetime, mysqlEnum, text, varchar, mysqlTable, longtext, year, index, tinyint, primaryKey } from 'drizzle-orm/mysql-core';
import { createId } from '@paralleldrive/cuid2';
import { sql } from 'drizzle-orm/sql';
import { timestampsHelper } from './helper';
import { relations } from 'drizzle-orm';

export const users = mysqlTable('users', {
    userId: varchar({ length: 128 }).$defaultFn(() => createId()).primaryKey(),
    nip: varchar({ length: 128 }).unique(),
    nama: varchar({ length: 255 }),
    email: varchar({ length: 255 }).unique(),
    role: mysqlEnum(['admin', 'manajemen', 'dosen']).default('dosen'),
    profileImage: varchar({ length: 255 }),
    password: text().notNull(),

    ...timestampsHelper
}, (table) => {
    return {
        nipIdx: index("nip_index").on(table.nip),
        namaIdx: index("nama_index").on(table.nama),
        emailIdx: index("email_index").on(table.email),
        roleIdx: index("role_index").on(table.role)
    }
});

export const resetPassword = mysqlTable('password_reset', {
    resetId: varchar({ length: 128 }).$defaultFn(() => createId()).primaryKey(),
    userId: varchar({ length: 128 }).references(() => users.userId, { onDelete: 'cascade', onUpdate: 'cascade' }).notNull(),

    token: varchar({ length: 255 }),
    expiresAt: datetime().default(sql`CURRENT_TIMESTAMP`),

    ...timestampsHelper
})

export const resetToUser = relations(resetPassword, ({ one }) => ({
    users: one(users, {
        fields: [resetPassword.userId],
        references: [users.userId]
    })
}))

export const usersToKompetensis = mysqlTable('users_to_kompetensi', {
    userId: varchar({ length: 128 }).references(() => users.userId, { onDelete: 'cascade', onUpdate: 'cascade' }).notNull(),
    kompetensiId: varchar({ length: 128 }).references(() => kompetensis.kompetensiId, { onDelete: 'cascade', onUpdate: 'cascade' }).notNull(),

    ...timestampsHelper
}, (table) => {
    return {
        userIdx: index('users_index').on(table.userId),
        pk: primaryKey({ columns: [table.userId, table.kompetensiId] })
    }
});

export const usersToKompetensisRelations = relations(usersToKompetensis, ({ one }) => ({
    users: one(users, {
        fields: [usersToKompetensis.userId],
        references: [users.userId],
    }),
    kompetensi: one(kompetensis, {
        fields: [usersToKompetensis.kompetensiId],
        references: [kompetensis.kompetensiId],
    }),
}));


export const usersRelations = relations(users, ({ many }) => ({
    usersKegiatans: many(usersToKegiatans),
    usersKompetensi: many(usersToKompetensis),
    userToJumlahKegiatam: many(jumlahKegiatan),
    passwordReset: many(resetPassword)
}));

export const kompetensis = mysqlTable('kompetensi', {
    kompetensiId: varchar({ length: 128 }).$defaultFn(() => createId()).primaryKey(),
    namaKompetensi: varchar({ length: 255 }).notNull().unique(),

    ...timestampsHelper
});

export const kompetensiRelations = relations(kompetensis, ({ one }) => ({
    kompetensiUsers: one(usersToKompetensis),
    kompetensiKegiatans: one(kompetensisToKegiatans)
}))

export const kompetensisToKegiatans = mysqlTable('kompetensi_to_kegiatan', {
    kompetensiId: varchar({ length: 128 }).references(() => kompetensis.kompetensiId, { onDelete: 'cascade', onUpdate: 'cascade' }).notNull(),
    kegiatanId: varchar({ length: 128 }).references(() => kegiatans.kegiatanId, { onDelete: 'cascade', onUpdate: 'cascade' }).notNull(),

    ...timestampsHelper
}, (table) => {
    return {
        kompetensiIdx: index('kompetensi_index').on(table.kompetensiId),
        pk: primaryKey({ columns: [table.kompetensiId, table.kegiatanId] })
    }
});

// Relation for kompetensisToKegiatans
export const kompetensisToKegiatansRelations = relations(kompetensisToKegiatans, ({ one }) => ({
    kompetensi: one(kompetensis, {
        fields: [kompetensisToKegiatans.kompetensiId],
        references: [kompetensis.kompetensiId],
    }),
    kegiatan: one(kegiatans, {
        fields: [kompetensisToKegiatans.kegiatanId],
        references: [kegiatans.kegiatanId],
    }),
}));

export const kompetensisRelations = relations(kompetensis, ({ many }) => ({
    kompetensisToKegiatans: many(kompetensisToKegiatans), // Add relation to kegiatans
    usersKompetensis: many(usersToKompetensis), // Add relation to users
}));

export const kegiatans = mysqlTable('kegiatan', {
    kegiatanId: varchar({ length: 128 }).$defaultFn(() => createId()).primaryKey(),
    judulKegiatan: varchar({ length: 255 }).notNull(),
    tanggal: datetime().default(sql`CURRENT_TIMESTAMP`),
    tipeKegiatan: mysqlEnum(['non-jti', 'jti']).default('jti'),
    lokasi: varchar({ length: 255 }).notNull(),
    deskripsi: text(),

    ...timestampsHelper
}, (table) => {
    return {
        judulKegiatanIdx: index('judul_index').on(table.judulKegiatan),
        tanggalIdx: index('tanggal_index').on(table.tanggal),
        lokasi: index('lokasi_index').on(table.lokasi)
    }
});

// Relation for kegiatans
export const kegiatanRelations = relations(kegiatans, ({ many }) => ({
    usersKegiatans: many(usersToKegiatans),
    lampiranKegiatan: many(lampiranKegiatans),
    agendaKegiatans: many(agendaKegiatans), // Fix relation name here
    kompetensiKegiatan: many(kompetensisToKegiatans)
}));

export const usersToKegiatans = mysqlTable('users_to_kegiatan', {
    userId: varchar({ length: 128 }).references(() => users.userId, { onDelete: 'cascade', onUpdate: 'cascade' }).notNull(),
    kegiatanId: varchar({ length: 128 }).references(() => kegiatans.kegiatanId, { onDelete: 'cascade', onUpdate: 'cascade' }).notNull(), // Fix here

    status: mysqlEnum(['ditugaskan', 'selesai']).default('ditugaskan'),
    roleKegiatan: mysqlEnum(['pic', 'anggota']).default('anggota'),

    ...timestampsHelper
}, (table) => {
    return {
        userIdx: index('users_index').on(table.userId),
        kegiatanIdx: index('kegiatan_index').on(table.kegiatanId),
        pk: primaryKey({ columns: [table.userId, table.kegiatanId] })
    }
});

// Relation for usersToKegiatans (junction table)
export const usersToKegiatansRelations = relations(usersToKegiatans, ({ one }) => ({
    users: one(users, {
        fields: [usersToKegiatans.userId],
        references: [users.userId]
    }),
    kegiatan: one(kegiatans, {
        fields: [usersToKegiatans.kegiatanId],
        references: [kegiatans.kegiatanId]
    })
}));

export const jumlahKegiatan = mysqlTable('jumlah_kegiatan', {
    userId: varchar({ length: 128 }).references(() => users.userId, { onDelete: 'cascade', onUpdate: 'cascade' }).notNull(),
    year: year().notNull(),
    month: tinyint().notNull(),
    jumlahKegiatan: int().default(0).notNull(),

    ...timestampsHelper
}, (table) => {
    return {
        userIdx: index('users_index').on(table.userId),
        yearIdx: index('year_index').on(table.year),
        pk: primaryKey({ columns: [table.userId, table.year, table.month] })
    }
});

// Relations for jumlahKegiatan
export const jumlahKegiatanRelations = relations(jumlahKegiatan, ({ one }) => ({
    users: one(users, {
        fields: [jumlahKegiatan.userId],
        references: [users.userId]
    })
}));

export const lampiranKegiatans = mysqlTable('lampiran_kegiatan', {
    lampiranId: varchar({ length: 128 }).$defaultFn(() => createId()).primaryKey(),
    kegiatanId: varchar({ length: 128 }).references(() => kegiatans.kegiatanId, { onDelete: 'cascade', onUpdate: 'cascade' }).notNull(),

    nama: varchar({ length: 255 }).notNull(),
    url: longtext().notNull(),

    ...timestampsHelper
}, (table) => {
    return {
        namaIdx: index('namaLampiran_index').on(table.nama)
    }
});

// Relations lampiran
export const lampiranKegiatansRelations = relations(lampiranKegiatans, ({ one }) => ({
    kegiatan: one(kegiatans, {
        fields: [lampiranKegiatans.kegiatanId],
        references: [kegiatans.kegiatanId],
    }),
}));

export const agendaKegiatans = mysqlTable('agenda_kegiatan', {
    agendaId: varchar({ length: 128 }).$defaultFn(() => createId()).primaryKey(),
    kegiatanId: varchar({ length: 128 }).references(() => kegiatans.kegiatanId, { onDelete: 'cascade', onUpdate: 'cascade' }).notNull(),
    userId: varchar({ length: 128 }).references(() => users.userId, { onDelete: 'cascade', onUpdate: 'cascade' }).notNull(),

    jadwalAgenda: datetime().notNull(),
    namaAgenda: varchar({ length: 255 }).notNull(),
    deskripsiAgenda: text(),
    status: mysqlEnum(['rencana', 'jalan', 'selesai']),

    ...timestampsHelper
}, (table) => {
    return {
        jadwalAgendaIdx: index('jadwalAgenda_index').on(table.jadwalAgenda),
        namaAgendaIdx: index('namaAgenda_index').on(table.namaAgenda)
    }
});

export const agendaKegiatansRelations = relations(agendaKegiatans, ({ one, many }) => ({
    kegiatan: one(kegiatans, {
        fields: [agendaKegiatans.kegiatanId],
        references: [kegiatans.kegiatanId],
    }),
    progress: many(progressAgenda)
}));

export const progressAgenda = mysqlTable('prog_agenda', {
    progressId: varchar({ length: 128 }).$defaultFn(() => createId()).primaryKey(),
    agendaId: varchar({ length: 128 }).references(() => (agendaKegiatans.agendaId), { onDelete: 'cascade', onUpdate: 'cascade' }).notNull(),

    deskripsiProgress: longtext().notNull(),

    ...timestampsHelper
})

export const progressAgendaRelations = relations(progressAgenda, ({ one, many }) => ({
    progress: one(agendaKegiatans, {
        fields: [progressAgenda.agendaId],
        references: [agendaKegiatans.agendaId]
    }),
    progressAgendaToProgressAttachment: many(progressAgendaToProgressAttachment)
}))

export const progressAttachments = mysqlTable('prog_attach', {
    attachmentId: varchar({ length: 128 }).$defaultFn(() => createId()).primaryKey(),

    hash: varchar({ length: 128 }).notNull().unique(),
    url: longtext().notNull(),

    ...timestampsHelper
}, (table) => {
    return {
        hashIndex: index('hash_index').on(table.hash)
    }
})

export const progressAttachmentsRelations = relations(progressAttachments, ({ many }) => ({
    progressAgendaToProgressAttachment: many(progressAgendaToProgressAttachment)
}))

export const progressAgendaToProgressAttachment = mysqlTable('prog_to_attach', {
    progressId: varchar({ length: 128 }).references(() => (progressAgenda.progressId), { onDelete: 'cascade', onUpdate: 'cascade' }).notNull(),
    attachmentId: varchar({ length: 128 }).references(() => (progressAttachments.attachmentId), { onDelete: 'cascade', onUpdate: 'cascade' }).notNull(),

    ...timestampsHelper
}, (table) => {
    return {
        messageIdx: index('progress_index').on(table.progressId),
        pk: primaryKey({ columns: [table.progressId, table.attachmentId] }),
    };
})

export const progressAgendaToProgressAttachmentRelations = relations(progressAgendaToProgressAttachment, ({ one }) => ({
    progress: one(progressAgenda, {
        fields: [progressAgendaToProgressAttachment.progressId],
        references: [progressAgenda.progressId]
    }),
    attachment: one(progressAttachments, {
        fields: [progressAgendaToProgressAttachment.attachmentId],
        references: [progressAttachments.attachmentId]
    })
}))

