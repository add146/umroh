ALTER TABLE `users` ADD `nik` text;--> statement-breakpoint
CREATE UNIQUE INDEX `users_nik_unique` ON `users` (`nik`);