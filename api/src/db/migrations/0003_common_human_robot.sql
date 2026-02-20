ALTER TABLE `packages` ADD `slug` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `packages_slug_unique` ON `packages` (`slug`);