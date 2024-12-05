import { int, datetime, mysqlEnum, text, varchar, mysqlTable, longtext, year, index, tinyint, primaryKey, boolean, uniqueIndex, foreignKey } from 'drizzle-orm/mysql-core';
import { init } from '@paralleldrive/cuid2';
import { sql } from 'drizzle-orm/sql';
import { timestampsHelper } from './helper';
import { relations } from 'drizzle-orm';

const createId = init({ length: 24, fingerprint: process.env.CUID_FINGERPINT });

export const users = mysqlTable('users', {
    userId: varchar({ length: 24 }).$defaultFn(() => createId()).primaryKey(),
    nip: varchar({ length: 18 }).unique(),
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

export const usersRelations = relations(users, ({ many }) => ({
    kegiatans: many(usersToKegiatans),
    userToJumlahKegiatan: many(jumlahKegiatan),
    passwordReset: many(resetPassword)
}));

export const resetPassword = mysqlTable('password_reset', {
    resetId: varchar({ length: 24 }).$defaultFn(() => createId()).primaryKey(),
    userId: varchar({ length: 24 }).references(() => users.userId, { onDelete: 'cascade', onUpdate: 'cascade' }).notNull(),

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
export const usersFcmToken = mysqlTable('users_fcm_token', {
    fcmId: varchar({ length: 24 }).$defaultFn(() => createId()).primaryKey(),
    userId: varchar({ length: 24 }).references(() => users.userId, { onDelete: 'cascade', onUpdate: 'cascade' }).notNull(),

    fcmtoken: text(),
    deviceType: mysqlEnum(['web', 'mobile']),

    ...timestampsHelper
})

export const usersFcmTokenRelations = relations(usersFcmToken, ({ one }) => ({
    users: one(users, {
        fields: [usersFcmToken.userId],
        references: [users.userId]
    })
}))

export const kegiatans = mysqlTable('kegiatan', {
    kegiatanId: varchar({ length: 24 }).$defaultFn(() => createId()).primaryKey(),
    tipeKegiatanId: varchar({ length: 24 }).references(() => tipeKegiatan.tipeKegiatanId, { onDelete: 'cascade', onUpdate: 'cascade' }).notNull(),

    judul: varchar({ length: 255 }).notNull(),
    tanggalMulai: datetime().default(sql`CURRENT_TIMESTAMP`),
    tanggalAkhir: datetime().notNull(),
    isDone: boolean().default(false),
    lokasi: varchar({ length: 100 }).notNull(),
    deskripsi: text(),

    ...timestampsHelper
}, (table) => {
    return {
        judulKegiatanIdx: index('judul_index').on(table.judul),
        tanggalIdx: index('tanggal_index').on(table.tanggalMulai),
        lokasi: index('lokasi_index').on(table.lokasi)
    }
});

export const kegiatanRelations = relations(kegiatans, ({ many, one }) => ({
    users: many(usersToKegiatans),
    lampiran: many(lampiranKegiatans),
    agenda: many(agendaKegiatans),
    tipeKegiatan: one(tipeKegiatan, {
        fields: [kegiatans.tipeKegiatanId],
        references: [tipeKegiatan.tipeKegiatanId]
    }),
}));

export const tipeKegiatan = mysqlTable('tipe_kegiatan', {
    tipeKegiatanId: varchar({ length: 24 }).$defaultFn(() => createId()).primaryKey(),

    tipeKegiatan: varchar({ length: 255 }).notNull(),

    ...timestampsHelper
})

export const tipeKegiatanRelations = relations(tipeKegiatan, ({ many }) => ({
    kegiatan: many(kegiatans)
}))

export const usersToKegiatans = mysqlTable('users_to_kegiatan', {
    userToKegiatanId: varchar({ length: 24 }).$defaultFn(() => createId()).primaryKey(),
    userId: varchar({ length: 24 }).references(() => users.userId, { onDelete: 'cascade', onUpdate: 'cascade' }).notNull(),
    kegiatanId: varchar({ length: 24 }).references(() => kegiatans.kegiatanId, { onDelete: 'cascade', onUpdate: 'cascade' }).notNull(), // Fix here
    jabatanId: varchar({ length: 24 }).references(() => jabatanAnggota.jabatanId, { onDelete: 'cascade', onUpdate: 'cascade' }).notNull(),

    ...timestampsHelper
}, (table) => {
    return {
        userIdx: index('users_index').on(table.userId),
        kegiatanIdx: index('kegiatan_index').on(table.kegiatanId),
        uniqueIndex: uniqueIndex('user_kegiatan_unique').on(table.userId, table.kegiatanId)
    }
});

export const usersToKegiatansRelations = relations(usersToKegiatans, ({ one, many }) => ({
    users: one(users, {
        fields: [usersToKegiatans.userId],
        references: [users.userId]
    }),
    kegiatans: one(kegiatans, {
        fields: [usersToKegiatans.kegiatanId],
        references: [kegiatans.kegiatanId]
    }),
    jabatans: one(jabatanAnggota, {
        fields: [usersToKegiatans.jabatanId],
        references: [jabatanAnggota.jabatanId]
    }),
    agendas: many(agendaToUsersKegiatans),
}));

export const jabatanAnggota = mysqlTable('jabatan_anggota', {
    jabatanId: varchar({ length: 24 }).$defaultFn(() => createId()).primaryKey(),
    namaJabatan: varchar({ length: 100 }).notNull(),
    isPic: boolean().default(false),

    ...timestampsHelper
})

export const jabatanAnggotaRelations = relations(jabatanAnggota, ({ many }) => ({
    userToKegiatan: many(usersToKegiatans)
}))

export const jumlahKegiatan = mysqlTable('jumlah_kegiatan', {
    userId: varchar({ length: 24 }).references(() => users.userId, { onDelete: 'cascade', onUpdate: 'cascade' }).notNull(),
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

export const jumlahKegiatanRelations = relations(jumlahKegiatan, ({ one }) => ({
    users: one(users, {
        fields: [jumlahKegiatan.userId],
        references: [users.userId]
    })
}));

export const lampiranKegiatans = mysqlTable('lampiran_kegiatan', {
    lampiranId: varchar({ length: 24 }).$defaultFn(() => createId()).primaryKey(),
    kegiatanId: varchar({ length: 24 }).references(() => kegiatans.kegiatanId, { onDelete: 'cascade', onUpdate: 'cascade' }).notNull(),

    nama: varchar({ length: 255 }).notNull(),
    url: longtext().notNull(),

    ...timestampsHelper
}, (table) => {
    return {
        namaIdx: index('namaLampiran_index').on(table.nama)
    }
});

export const lampiranKegiatansRelations = relations(lampiranKegiatans, ({ one }) => ({
    kegiatans: one(kegiatans, {
        fields: [lampiranKegiatans.kegiatanId],
        references: [kegiatans.kegiatanId],
    }),
}));

export const agendaKegiatans = mysqlTable('agenda_kegiatan', {
    agendaId: varchar({ length: 24 }).$defaultFn(() => createId()).primaryKey(),
    kegiatanId: varchar({ length: 24 }).references(() => kegiatans.kegiatanId, { onDelete: 'cascade', onUpdate: 'cascade' }).notNull(),

    jadwalAgenda: datetime().notNull(),
    namaAgenda: varchar({ length: 255 }).notNull(),
    deskripsiAgenda: text(),
    isDone: boolean().default(false),

    ...timestampsHelper
}, (table) => {
    return {
        jadwalAgendaIdx: index('jadwalAgenda_index').on(table.jadwalAgenda),
        namaAgendaIdx: index('namaAgenda_index').on(table.namaAgenda)
    }
});

export const agendaKegiatansRelations = relations(agendaKegiatans, ({ one, many }) => ({
    kegiatans: one(kegiatans, {
        fields: [agendaKegiatans.kegiatanId],
        references: [kegiatans.kegiatanId],
    }),
    progress: many(progressAgenda),
    agendaToUser: many(agendaToUsersKegiatans),
}));

export const agendaToUsersKegiatans = mysqlTable('agenda_to_user_kegiatan', {
    agendaId: varchar({ length: 24 }).references(() => agendaKegiatans.agendaId, { onDelete: 'cascade', onUpdate: 'cascade' }).notNull(),
    userKegiatanId: varchar({ length: 24 }).notNull(),

    ...timestampsHelper,
}, (table) => {
    return {
        agendaIdx: index('agenda_index').on(table.agendaId),
        userKegiatanIdx: index('user_kegiatan_index').on(table.userKegiatanId),
        uniqueIndex: uniqueIndex('agenda_userkeg_unique').on(table.agendaId, table.userKegiatanId),

        userToKegiatan: foreignKey({
            name: "user_to_kegiatan_id",
            columns: [table.userKegiatanId],
            foreignColumns: [usersToKegiatans.userToKegiatanId]
        }).onDelete('cascade').onUpdate('cascade')
    };
});


export const agendaToUsersKegiatansRelations = relations(agendaToUsersKegiatans, ({ one }) => ({
    agendas: one(agendaKegiatans, {
        fields: [agendaToUsersKegiatans.agendaId],
        references: [agendaKegiatans.agendaId]
    }),
    userToKegiatans: one(usersToKegiatans, {
        fields: [agendaToUsersKegiatans.userKegiatanId],
        references: [usersToKegiatans.userToKegiatanId]
    })
}))

export const progressAgenda = mysqlTable('progress_agenda', {
    progressId: varchar({ length: 24 }).$defaultFn(() => createId()).primaryKey(),
    agendaId: varchar({ length: 24 }).references(() => (agendaKegiatans.agendaId), { onDelete: 'cascade', onUpdate: 'cascade' }).notNull(),

    deskripsiProgress: longtext().notNull(),

    ...timestampsHelper
})

export const progressAgendaRelations = relations(progressAgenda, ({ one, many }) => ({
    progress: one(agendaKegiatans, {
        fields: [progressAgenda.agendaId],
        references: [agendaKegiatans.agendaId]
    }),
    progressAttachment: many(progressAgendaToProgressAttachment)
}))

export const progressAttachments = mysqlTable('progress_attachment', {
    attachmentId: varchar({ length: 24 }).$defaultFn(() => createId()).primaryKey(),

    nama: varchar({ length: 255 }).notNull(),
    hash: varchar({ length: 32 }).notNull().unique(),
    url: longtext().notNull(),

    ...timestampsHelper
}, (table) => {
    return {
        hashIndex: index('hash_index').on(table.hash)
    }
})

export const progressAttachmentsRelations = relations(progressAttachments, ({ many }) => ({
    progressAgendaToAttachment: many(progressAgendaToProgressAttachment)
}))

export const progressAgendaToProgressAttachment = mysqlTable('progress_to_attachment', {
    progressId: varchar({ length: 24 }).notNull(),
    attachmentId: varchar({ length: 24 }).notNull(),

    ...timestampsHelper
}, (table) => {
    return {
        messageIdx: index('progress_index').on(table.progressId),
        pk: primaryKey({ columns: [table.progressId, table.attachmentId] }),
        progress: foreignKey({
            name: "progress",
            columns: [table.progressId],
            foreignColumns: [progressAgenda.progressId]
        }).onDelete('cascade').onUpdate('cascade'),
        attachment: foreignKey({
            name: "attachment",
            columns: [table.attachmentId],
            foreignColumns: [progressAttachments.attachmentId]
        }).onDelete('cascade').onUpdate('cascade'),
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

