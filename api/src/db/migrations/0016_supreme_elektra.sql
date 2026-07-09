CREATE TABLE `booking_custom_equipment` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`item_name` text NOT NULL,
	`added_by` text NOT NULL,
	`status` text DEFAULT 'pending',
	`received_at` text,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`added_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `equipment_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`equipment_item_ids` text NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
DROP INDEX `pilgrims_no_ktp_unique`;--> statement-breakpoint
ALTER TABLE `bookings` ADD `equipment_set_id` text REFERENCES equipment_sets(id);