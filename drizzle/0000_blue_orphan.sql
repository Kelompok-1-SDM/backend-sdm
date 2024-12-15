CREATE TABLE `agenda_kegiatan` (
	`agenda_id` varchar(24) NOT NULL,
	`kegiatan_id` varchar(24) NOT NULL,
	`jadwal_agenda` datetime NOT NULL,
	`nama_agenda` varchar(255) NOT NULL,
	`deskripsi_agenda` text,
	`is_done` boolean DEFAULT false,
	`updated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agenda_kegiatan_agenda_id` PRIMARY KEY(`agenda_id`)
);
--> statement-breakpoint
CREATE TABLE `agenda_to_user_kegiatan` (
	`agenda_id` varchar(24) NOT NULL,
	`user_to_kegiatan_id` varchar(24) NOT NULL,
	`updated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agenda_userkeg_unique` UNIQUE(`agenda_id`,`user_to_kegiatan_id`)
);
--> statement-breakpoint
CREATE TABLE `jabatan_anggota` (
	`jabatan_id` varchar(24) NOT NULL,
	`nama_jabatan` varchar(100) NOT NULL,
	`is_pic` boolean DEFAULT false,
	`updated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `jabatan_anggota_jabatan_id` PRIMARY KEY(`jabatan_id`)
);
--> statement-breakpoint
CREATE TABLE `jumlah_kegiatan` (
	`user_id` varchar(24) NOT NULL,
	`year` year NOT NULL,
	`month` tinyint NOT NULL,
	`jumlah_kegiatan` int NOT NULL DEFAULT 0,
	`updated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `jumlah_kegiatan_user_id_year_month_pk` PRIMARY KEY(`user_id`,`year`,`month`)
);
--> statement-breakpoint
CREATE TABLE `kegiatan` (
	`kegiatan_id` varchar(24) NOT NULL,
	`tipe_kegiatan_id` varchar(24),
	`judul` varchar(255) NOT NULL,
	`tanggal_mulai` datetime DEFAULT CURRENT_TIMESTAMP,
	`tanggal_akhir` datetime NOT NULL,
	`is_done` boolean DEFAULT false,
	`lokasi` varchar(100) NOT NULL,
	`deskripsi` text,
	`progress` text,
	`updated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kegiatan_kegiatan_id` PRIMARY KEY(`kegiatan_id`)
);
--> statement-breakpoint
CREATE TABLE `lampiran_kegiatan` (
	`lampiran_id` varchar(24) NOT NULL,
	`kegiatan_id` varchar(24) NOT NULL,
	`nama` varchar(255) NOT NULL,
	`url` longtext NOT NULL,
	`updated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lampiran_kegiatan_lampiran_id` PRIMARY KEY(`lampiran_id`)
);
--> statement-breakpoint
CREATE TABLE `progress_agenda` (
	`progress_id` varchar(24) NOT NULL,
	`agenda_id` varchar(24) NOT NULL,
	`deskripsi_progress` longtext NOT NULL,
	`updated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `progress_agenda_progress_id` PRIMARY KEY(`progress_id`)
);
--> statement-breakpoint
CREATE TABLE `progress_to_attachment` (
	`progress_id` varchar(24) NOT NULL,
	`attachment_id` varchar(24),
	`updated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `unique_progress_attachment` UNIQUE(`progress_id`,`attachment_id`)
);
--> statement-breakpoint
CREATE TABLE `progress_attachment` (
	`attachment_id` varchar(24) NOT NULL,
	`nama` varchar(255) NOT NULL,
	`hash` varchar(32) NOT NULL,
	`url` longtext NOT NULL,
	`updated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `progress_attachment_attachment_id` PRIMARY KEY(`attachment_id`),
	CONSTRAINT `progress_attachment_hash_unique` UNIQUE(`hash`)
);
--> statement-breakpoint
CREATE TABLE `password_reset` (
	`reset_id` varchar(24) NOT NULL,
	`user_id` varchar(24) NOT NULL,
	`token` varchar(255),
	`expires_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `password_reset_reset_id` PRIMARY KEY(`reset_id`)
);
--> statement-breakpoint
CREATE TABLE `tipe_kegiatan` (
	`tipe_kegiatan_id` varchar(24) NOT NULL,
	`tipe_kegiatan` varchar(255) NOT NULL,
	`is_jti` boolean DEFAULT true,
	`updated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tipe_kegiatan_tipe_kegiatan_id` PRIMARY KEY(`tipe_kegiatan_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`user_id` varchar(24) NOT NULL,
	`nip` varchar(18),
	`nama` varchar(255),
	`email` varchar(255),
	`role` enum('admin','manajemen','dosen') DEFAULT 'dosen',
	`profile_image` varchar(255),
	`password` text NOT NULL,
	`updated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_user_id` PRIMARY KEY(`user_id`),
	CONSTRAINT `users_nip_unique` UNIQUE(`nip`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `users_fcm_token` (
	`fcm_id` varchar(24) NOT NULL,
	`user_id` varchar(24) NOT NULL,
	`fcmtoken` text,
	`device_type` enum('web','mobile'),
	`updated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_fcm_token_fcm_id` PRIMARY KEY(`fcm_id`)
);
--> statement-breakpoint
CREATE TABLE `users_to_kegiatan` (
	`user_to_kegiatan_id` varchar(24) NOT NULL,
	`user_id` varchar(24) NOT NULL,
	`kegiatan_id` varchar(24) NOT NULL,
	`jabatan_id` varchar(24),
	`updated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_to_kegiatan_user_to_kegiatan_id` PRIMARY KEY(`user_to_kegiatan_id`),
	CONSTRAINT `user_kegiatan_unique` UNIQUE(`user_id`,`kegiatan_id`)
);
--> statement-breakpoint
ALTER TABLE `agenda_kegiatan` ADD CONSTRAINT `agenda_kegiatan_kegiatan_id_kegiatan_kegiatan_id_fk` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan`(`kegiatan_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `agenda_to_user_kegiatan` ADD CONSTRAINT `agenda_to_user_kegiatan_agenda_id_agenda_kegiatan_agenda_id_fk` FOREIGN KEY (`agenda_id`) REFERENCES `agenda_kegiatan`(`agenda_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `agenda_to_user_kegiatan` ADD CONSTRAINT `user_to_kegiatan_id` FOREIGN KEY (`user_to_kegiatan_id`) REFERENCES `users_to_kegiatan`(`user_to_kegiatan_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `jumlah_kegiatan` ADD CONSTRAINT `jumlah_kegiatan_user_id_users_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `kegiatan` ADD CONSTRAINT `kegiatan_tipe_kegiatan_id_tipe_kegiatan_tipe_kegiatan_id_fk` FOREIGN KEY (`tipe_kegiatan_id`) REFERENCES `tipe_kegiatan`(`tipe_kegiatan_id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `lampiran_kegiatan` ADD CONSTRAINT `lampiran_kegiatan_kegiatan_id_kegiatan_kegiatan_id_fk` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan`(`kegiatan_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `progress_agenda` ADD CONSTRAINT `progress_agenda_agenda_id_agenda_kegiatan_agenda_id_fk` FOREIGN KEY (`agenda_id`) REFERENCES `agenda_kegiatan`(`agenda_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `progress_to_attachment` ADD CONSTRAINT `progress` FOREIGN KEY (`progress_id`) REFERENCES `progress_agenda`(`progress_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `progress_to_attachment` ADD CONSTRAINT `attachment` FOREIGN KEY (`attachment_id`) REFERENCES `progress_attachment`(`attachment_id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `password_reset` ADD CONSTRAINT `password_reset_user_id_users_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `users_fcm_token` ADD CONSTRAINT `users_fcm_token_user_id_users_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `users_to_kegiatan` ADD CONSTRAINT `users_to_kegiatan_user_id_users_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `users_to_kegiatan` ADD CONSTRAINT `users_to_kegiatan_kegiatan_id_kegiatan_kegiatan_id_fk` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan`(`kegiatan_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `users_to_kegiatan` ADD CONSTRAINT `users_to_kegiatan_jabatan_id_jabatan_anggota_jabatan_id_fk` FOREIGN KEY (`jabatan_id`) REFERENCES `jabatan_anggota`(`jabatan_id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `jadwalAgenda_index` ON `agenda_kegiatan` (`jadwal_agenda`);--> statement-breakpoint
CREATE INDEX `namaAgenda_index` ON `agenda_kegiatan` (`nama_agenda`);--> statement-breakpoint
CREATE INDEX `agenda_index` ON `agenda_to_user_kegiatan` (`agenda_id`);--> statement-breakpoint
CREATE INDEX `user_kegiatan_index` ON `agenda_to_user_kegiatan` (`user_to_kegiatan_id`);--> statement-breakpoint
CREATE INDEX `users_index` ON `jumlah_kegiatan` (`user_id`);--> statement-breakpoint
CREATE INDEX `year_index` ON `jumlah_kegiatan` (`year`);--> statement-breakpoint
CREATE INDEX `judul_index` ON `kegiatan` (`judul`);--> statement-breakpoint
CREATE INDEX `tanggal_index` ON `kegiatan` (`tanggal_mulai`);--> statement-breakpoint
CREATE INDEX `lokasi_index` ON `kegiatan` (`lokasi`);--> statement-breakpoint
CREATE INDEX `namaLampiran_index` ON `lampiran_kegiatan` (`nama`);--> statement-breakpoint
CREATE INDEX `progress_index` ON `progress_to_attachment` (`progress_id`);--> statement-breakpoint
CREATE INDEX `hash_index` ON `progress_attachment` (`hash`);--> statement-breakpoint
CREATE INDEX `nip_index` ON `users` (`nip`);--> statement-breakpoint
CREATE INDEX `nama_index` ON `users` (`nama`);--> statement-breakpoint
CREATE INDEX `email_index` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `role_index` ON `users` (`role`);--> statement-breakpoint
CREATE INDEX `users_index` ON `users_to_kegiatan` (`user_id`);--> statement-breakpoint
CREATE INDEX `kegiatan_index` ON `users_to_kegiatan` (`kegiatan_id`);