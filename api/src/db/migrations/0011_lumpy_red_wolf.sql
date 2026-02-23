CREATE TABLE `package_types` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`password` text NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`nik` text,
	`role` text NOT NULL,
	`affiliate_code` text,
	`parent_id` text,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "email", "password", "name", "phone", "nik", "role", "affiliate_code", "parent_id", "is_active", "created_at", "updated_at") 
SELECT "id", "email", "password", "name", "phone", "nik", "role", "affiliate_code", "parent_id", "is_active", "created_at", "updated_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_phone_unique` ON `users` (`phone`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_nik_unique` ON `users` (`nik`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_affiliate_code_unique` ON `users` (`affiliate_code`);--> statement-breakpoint
ALTER TABLE `packages` ADD `hotels` text;--> statement-breakpoint
ALTER TABLE `packages` ADD `currency` text DEFAULT 'IDR';--> statement-breakpoint
ALTER TABLE `packages` ADD `dp_amount` integer DEFAULT 0;