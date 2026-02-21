CREATE TABLE `airlines` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`icon` text,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE TABLE `airports` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`city` text NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE TABLE `hotels` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`city` text NOT NULL,
	`star_rating` integer DEFAULT 3 NOT NULL,
	`distance_to_haram` text,
	`image` text,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
ALTER TABLE `departures` ADD `trip_name` text;--> statement-breakpoint
ALTER TABLE `departures` ADD `departure_airline_id` text REFERENCES airlines(id);--> statement-breakpoint
ALTER TABLE `departures` ADD `return_airline_id` text REFERENCES airlines(id);--> statement-breakpoint
ALTER TABLE `departures` ADD `departure_airport_id` text REFERENCES airports(id);--> statement-breakpoint
ALTER TABLE `departures` ADD `arrival_airport_id` text REFERENCES airports(id);--> statement-breakpoint
ALTER TABLE `departures` ADD `siskopatuh_status` text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `packages` ADD `package_type` text;--> statement-breakpoint
ALTER TABLE `packages` ADD `star_rating` integer DEFAULT 3;--> statement-breakpoint
ALTER TABLE `packages` ADD `images` text;--> statement-breakpoint
ALTER TABLE `packages` ADD `is_promo` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `packages` ADD `promo_text` text;--> statement-breakpoint
ALTER TABLE `packages` ADD `makkah_hotel_id` text REFERENCES hotels(id);--> statement-breakpoint
ALTER TABLE `packages` ADD `madinah_hotel_id` text REFERENCES hotels(id);--> statement-breakpoint
ALTER TABLE `packages` ADD `itinerary` text;--> statement-breakpoint
ALTER TABLE `packages` ADD `facilities` text;--> statement-breakpoint
ALTER TABLE `packages` ADD `terms_conditions` text;--> statement-breakpoint
ALTER TABLE `packages` ADD `requirements` text;