CREATE TABLE `affiliate_clicks` (
	`id` text PRIMARY KEY NOT NULL,
	`affiliate_code` text NOT NULL,
	`user_id` text,
	`ip_address` text,
	`user_agent` text,
	`clicked_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `commission_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`amount` integer NOT NULL,
	`commission_type` text NOT NULL,
	`status` text DEFAULT 'pending',
	`paid_at` text,
	`paid_by` text,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`paid_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
