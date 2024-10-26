import { int, datetime, mysqlEnum, text, varchar, mysqlTable, longtext, year, index, foreignKey } from 'drizzle-orm/mysql-core';
import { createId } from '@paralleldrive/cuid2';
import { sql } from 'drizzle-orm/sql';
import { timestampsHelper } from './helper';
import { relations } from 'drizzle-orm';

export const users = mysqlTable('user', {
    userId: varchar({ length: 128 }).$defaultFn(() => createId()).primaryKey(),
    nip: varchar({ length: 128 }).notNull().unique(),
    nama: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull().unique(),
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

export const usersToKompetensis = mysqlTable('user_to_kompetensi', {
    userId: varchar({ length: 128 }).notNull().references(() => users.userId),
    kompetensiId: varchar({ length: 128 }).notNull().references(() => kompetensis.kompetensiId),

    ...timestampsHelper
}, (table) => {
    return {
        userIdx: index('user_index').on(table.userId)
    }
});

export const usersToKompetensisRelations = relations(usersToKompetensis, ({ one }) => ({
    user: one(users, {
        fields: [usersToKompetensis.userId],
        references: [users.userId],
    }),
    kompetensi: one(kompetensis, {
        fields: [usersToKompetensis.kompetensiId],
        references: [kompetensis.kompetensiId],
    }),
}));


export const usersRelations = relations(users, ({ many }) => ({
    groupMessages: many(groupsMessages), // A user can send many messages
    usersKegiatans: many(usersToKegiatans)
}));

export const kompetensis = mysqlTable('kompetensi', {
    kompetensiId: varchar({ length: 128 }).$defaultFn(() => createId()).primaryKey(),
    namaKompetensi: varchar({ length: 255 }).notNull(),

    ...timestampsHelper
});

export const kompetensisToKegiatans = mysqlTable('kompetensi_to_kegiatan', {
    kompetensiId: varchar({ length: 128 }).notNull().references(() => kompetensis.kompetensiId),
    kegiatanId: varchar({ length: 128 }).notNull().references(() => kegiatans.kegiatanId),

    ...timestampsHelper
}, (table) => {
    return {
        kompetensiIdx: index('kompetensi_index').on(table.kompetensiId)
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
    groupMessages: many(groupsMessages)
}));

export const usersToKegiatans = mysqlTable('user_to_kegiatan', {
    userId: varchar({ length: 128 }).notNull().references(() => users.userId),
    kegiatanId: varchar({ length: 128 }).notNull().references(() => kegiatans.kegiatanId), // Fix here

    status: mysqlEnum(['ditugaskan', 'selesai']).default('ditugaskan'),
    roleKegiatan: mysqlEnum(['pic', 'anggota']).default('anggota'),

    ...timestampsHelper
}, (table) => {
    return {
        userIdx: index('user_index').on(table.userId)
    }
});

// Relation for usersToKegiatans (junction table)
export const usersToKegiatansRelations = relations(usersToKegiatans, ({ one }) => ({
    user: one(users, {
        fields: [usersToKegiatans.userId],
        references: [users.userId]
    }),
    kegiatan: one(kegiatans, {
        fields: [usersToKegiatans.kegiatanId],
        references: [kegiatans.kegiatanId]
    })
}));

export const jumlahKegiatan = mysqlTable('jumlah_kegiatan', {
    userId: varchar({ length: 128 }).notNull().references(() => users.userId),
    year: year().notNull(),
    month: mysqlEnum(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']).notNull(),
    jumlahKegiatan: int().default(0).notNull(),

    ...timestampsHelper
}, (table) => {
    return {
        userIdx: index('user_index').on(table.userId),
        yearIdx: index('year_index').on(table.year)
    }
});

// Relations for jumlahKegiatan
export const jumlahKegiatanRelations = relations(jumlahKegiatan, ({ one }) => ({
    user: one(users, {
        fields: [jumlahKegiatan.userId],
        references: [users.userId]
    })
}));

export const lampiranKegiatans = mysqlTable('lampiran_kegiatan', {
    lampiranId: varchar({ length: 128 }).$defaultFn(() => createId()).primaryKey(),
    kegiatanId: varchar({ length: 128 }).notNull().references(() => kegiatans.kegiatanId),

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
    kegiatanId: varchar({ length: 128 }).notNull().references(() => kegiatans.kegiatanId),
    userId: varchar({ length: 128 }).notNull().references(() => users.userId),

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

export const progressAgenda = mysqlTable('progress_agenda', {
    progressId: varchar({ length: 128 }).$defaultFn(() => createId()).primaryKey(),
    agendaId: varchar({ length: 128 }).notNull().references(() => (agendaKegiatans.agendaId)),

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

export const progressAttachments = mysqlTable('progress_attachment', {
    attachmentId: varchar({ length: 128 }).$defaultFn(() => createId()).primaryKey(),

    hash: varchar({ length: 128 }).notNull(),
    url: longtext().notNull(),

    ...timestampsHelper
})

export const progressAttachmentsRelations = relations(progressAttachments, ({ many }) => ({
    progressAgendaToProgressAttachment: many(progressAgendaToProgressAttachment)
}))

export const progressAgendaToProgressAttachment = mysqlTable('progress_to_attachments', {
    progressId: varchar({ length: 128 }).notNull(),
    attachmentId: varchar({ length: 128 }).notNull(),

    ...timestampsHelper
}, (table) => {
    return {
        // Shorter foreign key name
        progressReference: foreignKey({
            columns: [table.progressId],
            foreignColumns: [progressAgenda.progressId],
            name: 'fk_prog_attach'  // Shortened name for foreign key
        }),
        attachmentReference: foreignKey({
            columns: [table.attachmentId],
            foreignColumns: [progressAttachments.attachmentId],
            name: 'fk_attach_prog'  // Shortened name for foreign key
        }),
        messageIdx: index('progress_index').on(table.progressId),
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

export const groupsMessages = mysqlTable('group_messages', {
    messagesId: varchar({ length: 128 }).$defaultFn(() => createId()).primaryKey(),
    kegiatanId: varchar({ length: 128 }).notNull().references(() => kegiatans.kegiatanId),
    userId: varchar({ length: 128 }).notNull().references(() => users.userId),

    text: longtext(),

    ...timestampsHelper
})

// Relation for group messages to users (Many-to-One)
export const groupsMessagesRelations = relations(groupsMessages, ({ one, many }) => ({
    user: one(users, {
        fields: [groupsMessages.userId],
        references: [users.userId], // A message is sent by one user
    }),
    kegiatan: one(kegiatans, {
        fields: [groupsMessages.kegiatanId],
        references: [kegiatans.kegiatanId], // A message is related to one kegiatan
    }),
    messagesToAttachment: many(messagesToAttachments)
}));

export const messagesAttachment = mysqlTable('messages_attachments', {
    attachmentId: varchar({ length: 128 }).$defaultFn(() => createId()).primaryKey(),

    hash: varchar({ length: 128 }).notNull(),
    url: longtext().notNull(),

    ...timestampsHelper
})

export const messagesAttachmentsRelations = relations(messagesAttachment, ({ many }) => ({
    messagesToAttachment: many(messagesToAttachments)
}))

export const messagesToAttachments = mysqlTable('messages_to_attachments', {
    messagesId: varchar({ length: 128 }).notNull(),
    attachmentId: varchar({ length: 128 }).notNull(),

    ...timestampsHelper
}, (table) => {
    return {
        // Shorter foreign key name
        messageReference: foreignKey({
            columns: [table.messagesId],
            foreignColumns: [groupsMessages.messagesId],
            name: 'fk_msg_attach_msg'  // Shortened name for foreign key
        }),
        attachmentReference: foreignKey({
            columns: [table.attachmentId],
            foreignColumns: [messagesAttachment.attachmentId],
            name: 'fk_attach_msg'  // Shortened name for foreign key
        }),
        messageIdx: index('message_index').on(table.messagesId),
    };
});


export const messagesToAttachmentsRelations = relations(messagesToAttachments, ({ one }) => ({
    message: one(groupsMessages, {
        fields: [messagesToAttachments.messagesId],
        references: [groupsMessages.messagesId]
    }),
    attachment: one(messagesAttachment, {
        fields: [messagesToAttachments.attachmentId],
        references: [messagesAttachment.attachmentId]
    })
}))