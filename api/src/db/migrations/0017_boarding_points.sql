CREATE TABLE `departure_boarding_points` (
	`id` text PRIMARY KEY NOT NULL,
	`departure_id` text NOT NULL,
	`airport_id` text NOT NULL,
	`is_origin` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`price_adjustment` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`departure_id`) REFERENCES `departures`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`airport_id`) REFERENCES `airports`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `bookings` ADD `boarding_point_id` text REFERENCES departure_boarding_points(id);
