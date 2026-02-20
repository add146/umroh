CREATE TABLE `bank_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`bank_name` text NOT NULL,
	`account_number` text NOT NULL,
	`account_holder` text NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE TABLE `payment_invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`invoice_code` text NOT NULL,
	`invoice_type` text NOT NULL,
	`amount` integer NOT NULL,
	`due_date` text,
	`status` text DEFAULT 'unpaid',
	`payment_mode` text NOT NULL,
	`midtrans_order_id` text,
	`midtrans_snap_token` text,
	`transfer_proof_key` text,
	`verified_by` text,
	`verified_at` text,
	`paid_at` text,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_invoices_invoice_code_unique` ON `payment_invoices` (`invoice_code`);--> statement-breakpoint
CREATE TABLE `payment_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`midtrans_transaction_id` text,
	`payment_type` text,
	`gross_amount` integer NOT NULL,
	`transaction_status` text NOT NULL,
	`raw_payload` text,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`invoice_id`) REFERENCES `payment_invoices`(`id`) ON UPDATE no action ON DELETE no action
);
