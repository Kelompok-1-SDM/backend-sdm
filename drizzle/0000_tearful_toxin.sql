CREATE TABLE `agenda_kegiatan` (
	`agenda_id` varchar(128) NOT NULL,
	`kegiatan_id` varchar(128) NOT NULL,
	`user_id` varchar(128) NOT NULL,
	`jadwal_agenda` datetime NOT NULL,
	`nama_agenda` varchar(255) NOT NULL,
	`deskripsi_agenda` text,
	`status` enum('rencana','jalan','selesai'),
	`updated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `agenda_kegiatan_agenda_id` PRIMARY KEY(`agenda_id`)
);
--> statement-breakpoint
CREATE TABLE `group_messages` (
	`messages_id` varchar(128) NOT NULL,
	`kegiatan_id` varchar(128) NOT NULL,
	`user_id` varchar(128) NOT NULL,
	`text` longtext,
	`updated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `group_messages_messages_id` PRIMARY KEY(`messages_id`)
);
--> statement-breakpoint
CREATE TABLE `jumlah_kegiatan` (
	`user_id` varchar(128) NOT NULL,
	`year` year NOT NULL,
	`month` enum('1','2','3','4','5','6','7','8','9','10','11','12') NOT NULL,
	`jumlah_kegiatan` int NOT NULL DEFAULT 0,
	`updated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp
);
--> statement-breakpoint
CREATE TABLE `kegiatan` (
	`kegiatan_id` varchar(128) NOT NULL,
	`judul_kegiatan` varchar(255) NOT NULL,
	`tanggal` datetime DEFAULT CURRENT_TIMESTAMP,
	`lokasi` varchar(255) NOT NULL,
	`deskripsi` text,
	`updated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `kegiatan_kegiatan_id` PRIMARY KEY(`kegiatan_id`)
);
--> statement-breakpoint
CREATE TABLE `kompetensi` (
	`kompetensi_id` varchar(128) NOT NULL,
	`nama_kompetensi` varchar(255) NOT NULL,
	`updated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `kompetensi_kompetensi_id` PRIMARY KEY(`kompetensi_id`)
);
--> statement-breakpoint
CREATE TABLE `kompetensi_to_kegiatan` (
	`kompetensi_id` varchar(128) NOT NULL,
	`kegiatan_id` varchar(128) NOT NULL,
	`updated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp
);
--> statement-breakpoint
CREATE TABLE `lampiran_kegiatan` (
	`lampiran_id` varchar(128) NOT NULL,
	`kegiatan_id` varchar(128) NOT NULL,
	`nama` varchar(255) NOT NULL,
	`url` longtext NOT NULL,
	`updated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `lampiran_kegiatan_lampiran_id` PRIMARY KEY(`lampiran_id`)
);
--> statement-breakpoint
CREATE TABLE `messages_attachments` (
	`attachment_id` varchar(128) NOT NULL,
	`hash` varchar(128) NOT NULL,
	`url` longtext NOT NULL,
	`updated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `messages_attachments_attachment_id` PRIMARY KEY(`attachment_id`)
);
--> statement-breakpoint
CREATE TABLE `messages_to_attachments` (
	`messages_id` varchar(128) NOT NULL,
	`attachment_id` varchar(128) NOT NULL,
	`updated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp
);
--> statement-breakpoint
CREATE TABLE `progress_agenda` (
	`progress_id` varchar(128) NOT NULL,
	`agenda_id` varchar(128) NOT NULL,
	`deskripsi_progress` longtext NOT NULL,
	`updated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `progress_agenda_progress_id` PRIMARY KEY(`progress_id`)
);
--> statement-breakpoint
CREATE TABLE `progress_to_attachments` (
	`progress_id` varchar(128) NOT NULL,
	`attachment_id` varchar(128) NOT NULL,
	`updated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp
);
--> statement-breakpoint
CREATE TABLE `progress_attachment` (
	`attachment_id` varchar(128) NOT NULL,
	`hash` varchar(128) NOT NULL,
	`url` longtext NOT NULL,
	`updated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `progress_attachment_attachment_id` PRIMARY KEY(`attachment_id`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`user_id` varchar(128) NOT NULL,
	`nip` varchar(128) NOT NULL,
	`nama` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`role` enum('admin','manajemen','dosen') DEFAULT 'dosen',
	`profile_image` varchar(255),
	`password` text NOT NULL,
	`updated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `user_user_id` PRIMARY KEY(`user_id`),
	CONSTRAINT `user_nip_unique` UNIQUE(`nip`),
	CONSTRAINT `user_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `user_to_kegiatan` (
	`user_id` varchar(128) NOT NULL,
	`kegiatan_id` varchar(128) NOT NULL,
	`status` enum('ditugaskan','selesai') DEFAULT 'ditugaskan',
	`role_kegiatan` enum('pic','anggota') DEFAULT 'anggota',
	`updated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp
);
--> statement-breakpoint
CREATE TABLE `user_to_kompetensi` (
	`user_id` varchar(128) NOT NULL,
	`kompetensi_id` varchar(128) NOT NULL,
	`updated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp
);
--> statement-breakpoint
ALTER TABLE `agenda_kegiatan` ADD CONSTRAINT `agenda_kegiatan_kegiatan_id_kegiatan_kegiatan_id_fk` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan`(`kegiatan_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agenda_kegiatan` ADD CONSTRAINT `agenda_kegiatan_user_id_user_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `group_messages` ADD CONSTRAINT `group_messages_kegiatan_id_kegiatan_kegiatan_id_fk` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan`(`kegiatan_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `group_messages` ADD CONSTRAINT `group_messages_user_id_user_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jumlah_kegiatan` ADD CONSTRAINT `jumlah_kegiatan_user_id_user_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kompetensi_to_kegiatan` ADD CONSTRAINT `kompetensi_to_kegiatan_kompetensi_id_kompetensi_kompetensi_id_fk` FOREIGN KEY (`kompetensi_id`) REFERENCES `kompetensi`(`kompetensi_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kompetensi_to_kegiatan` ADD CONSTRAINT `kompetensi_to_kegiatan_kegiatan_id_kegiatan_kegiatan_id_fk` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan`(`kegiatan_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lampiran_kegiatan` ADD CONSTRAINT `lampiran_kegiatan_kegiatan_id_kegiatan_kegiatan_id_fk` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan`(`kegiatan_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages_to_attachments` ADD CONSTRAINT `fk_msg_attach_msg` FOREIGN KEY (`messages_id`) REFERENCES `group_messages`(`messages_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages_to_attachments` ADD CONSTRAINT `fk_attach_msg` FOREIGN KEY (`attachment_id`) REFERENCES `messages_attachments`(`attachment_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `progress_agenda` ADD CONSTRAINT `progress_agenda_agenda_id_agenda_kegiatan_agenda_id_fk` FOREIGN KEY (`agenda_id`) REFERENCES `agenda_kegiatan`(`agenda_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `progress_to_attachments` ADD CONSTRAINT `fk_prog_attach` FOREIGN KEY (`progress_id`) REFERENCES `progress_agenda`(`progress_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `progress_to_attachments` ADD CONSTRAINT `fk_attach_prog` FOREIGN KEY (`attachment_id`) REFERENCES `progress_attachment`(`attachment_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_to_kegiatan` ADD CONSTRAINT `user_to_kegiatan_user_id_user_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_to_kegiatan` ADD CONSTRAINT `user_to_kegiatan_kegiatan_id_kegiatan_kegiatan_id_fk` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan`(`kegiatan_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_to_kompetensi` ADD CONSTRAINT `user_to_kompetensi_user_id_user_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_to_kompetensi` ADD CONSTRAINT `user_to_kompetensi_kompetensi_id_kompetensi_kompetensi_id_fk` FOREIGN KEY (`kompetensi_id`) REFERENCES `kompetensi`(`kompetensi_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `jadwalAgenda_index` ON `agenda_kegiatan` (`jadwal_agenda`);--> statement-breakpoint
CREATE INDEX `namaAgenda_index` ON `agenda_kegiatan` (`nama_agenda`);--> statement-breakpoint
CREATE INDEX `user_index` ON `jumlah_kegiatan` (`user_id`);--> statement-breakpoint
CREATE INDEX `year_index` ON `jumlah_kegiatan` (`year`);--> statement-breakpoint
CREATE INDEX `judul_index` ON `kegiatan` (`judul_kegiatan`);--> statement-breakpoint
CREATE INDEX `tanggal_index` ON `kegiatan` (`tanggal`);--> statement-breakpoint
CREATE INDEX `lokasi_index` ON `kegiatan` (`lokasi`);--> statement-breakpoint
CREATE INDEX `kompetensi_index` ON `kompetensi_to_kegiatan` (`kompetensi_id`);--> statement-breakpoint
CREATE INDEX `namaLampiran_index` ON `lampiran_kegiatan` (`nama`);--> statement-breakpoint
CREATE INDEX `message_index` ON `messages_to_attachments` (`messages_id`);--> statement-breakpoint
CREATE INDEX `progress_index` ON `progress_to_attachments` (`progress_id`);--> statement-breakpoint
CREATE INDEX `nip_index` ON `user` (`nip`);--> statement-breakpoint
CREATE INDEX `nama_index` ON `user` (`nama`);--> statement-breakpoint
CREATE INDEX `email_index` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `role_index` ON `user` (`role`);--> statement-breakpoint
CREATE INDEX `user_index` ON `user_to_kegiatan` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_index` ON `user_to_kompetensi` (`user_id`);