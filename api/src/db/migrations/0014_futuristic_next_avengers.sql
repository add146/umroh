ALTER TABLE `users` ADD `waha_api_url` text;--> statement-breakpoint
ALTER TABLE `users` ADD `waha_api_key` text;--> statement-breakpoint
ALTER TABLE `users` ADD `waha_session` text DEFAULT 'default';