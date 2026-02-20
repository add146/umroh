CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`departure_id` text NOT NULL,
	`pilgrim_id` text NOT NULL,
	`affiliator_id` text,
	`room_type_id` text NOT NULL,
	`total_price` integer NOT NULL,
	`payment_status` text DEFAULT 'unpaid',
	`booking_status` text DEFAULT 'pending',
	`booked_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`departure_id`) REFERENCES `departures`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`pilgrim_id`) REFERENCES `pilgrims`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`affiliator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`room_type_id`) REFERENCES `room_types`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `departures` (
	`id` text PRIMARY KEY NOT NULL,
	`package_id` text NOT NULL,
	`departure_date` text NOT NULL,
	`airport` text NOT NULL,
	`total_seats` integer NOT NULL,
	`booked_seats` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'available',
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`package_id`) REFERENCES `packages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `packages` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`base_price` integer NOT NULL,
	`image` text,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE TABLE `pilgrims` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`no_ktp` text NOT NULL,
	`sex` text NOT NULL,
	`born` text NOT NULL,
	`address` text NOT NULL,
	`father_name` text NOT NULL,
	`has_passport` integer DEFAULT false,
	`no_passport` text,
	`passport_from` text,
	`passport_release_date` text,
	`passport_expiry` text,
	`marital_status` text NOT NULL,
	`phone` text NOT NULL,
	`home_phone` text,
	`last_education` text NOT NULL,
	`work` text NOT NULL,
	`disease_history` text,
	`fam_member` text,
	`fam_contact_name` text NOT NULL,
	`fam_contact` text NOT NULL,
	`source_from` text NOT NULL,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pilgrims_no_ktp_unique` ON `pilgrims` (`no_ktp`);--> statement-breakpoint
CREATE TABLE `room_types` (
	`id` text PRIMARY KEY NOT NULL,
	`departure_id` text NOT NULL,
	`name` text NOT NULL,
	`capacity` integer NOT NULL,
	`price_adjustment` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`departure_id`) REFERENCES `departures`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `seat_locks` (
	`id` text PRIMARY KEY NOT NULL,
	`departure_id` text NOT NULL,
	`lock_key` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`departure_id`) REFERENCES `departures`(`id`) ON UPDATE no action ON DELETE no action
);
