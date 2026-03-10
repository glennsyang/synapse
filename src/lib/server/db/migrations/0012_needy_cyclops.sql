CREATE TABLE `daily_agenda_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`template_id` text,
	`template_group_id` text,
	`date` text NOT NULL,
	`title` text NOT NULL,
	`source_type` text DEFAULT 'default' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`completed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`template_id`) REFERENCES `daily_agenda_templates`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `daily_agenda_entries_user_date_idx` ON `daily_agenda_entries` (`user_id`,`date`);--> statement-breakpoint
CREATE INDEX `daily_agenda_entries_group_date_idx` ON `daily_agenda_entries` (`template_group_id`,`date`);--> statement-breakpoint
CREATE UNIQUE INDEX `daily_agenda_entries_default_unique_idx` ON `daily_agenda_entries` (`user_id`,`template_group_id`,`date`);--> statement-breakpoint
CREATE TABLE `daily_agenda_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`template_group_id` text NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`starts_on` text NOT NULL,
	`ends_on` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `daily_agenda_templates_user_range_idx` ON `daily_agenda_templates` (`user_id`,`starts_on`,`ends_on`);--> statement-breakpoint
CREATE INDEX `daily_agenda_templates_group_idx` ON `daily_agenda_templates` (`template_group_id`);