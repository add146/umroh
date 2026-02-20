CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`pilgrim_id` text NOT NULL,
	`doc_type` text NOT NULL,
	`r2_key` text NOT NULL,
	`ocr_result` text,
	`is_verified` integer DEFAULT false,
	`verified_at` text,
	`verified_by` text,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`pilgrim_id`) REFERENCES `pilgrims`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `equipment_checklist` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`equipment_item_id` text NOT NULL,
	`status` text DEFAULT 'pending',
	`received_at` text,
	`received_by` text,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`equipment_item_id`) REFERENCES `equipment_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`received_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `equipment_items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE TABLE `room_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`room_number` text NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action
);
