CREATE TABLE `package_types` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true
);

ALTER TABLE `packages` ADD `hotels` text;--> statement-breakpoint
ALTER TABLE `packages` ADD `currency` text DEFAULT 'IDR';--> statement-breakpoint
ALTER TABLE `packages` ADD `dp_amount` integer DEFAULT 0;