PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__daily_agenda_templates_new` (
	`id` text PRIMARY KEY NOT NULL,
	`template_group_id` text NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`starts_on` text NOT NULL,
	`ends_on` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`days_of_week` text DEFAULT '[0,1,2,3,4,5,6]' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__daily_agenda_templates_new` (
	`id`,
	`template_group_id`,
	`user_id`,
	`title`,
	`sort_order`,
	`starts_on`,
	`ends_on`,
	`created_at`,
	`updated_at`,
	`days_of_week`
)
SELECT
	`id`,
	`template_group_id`,
	`user_id`,
	`title`,
	`sort_order`,
	`starts_on`,
	`ends_on`,
	`created_at`,
	`updated_at`,
	coalesce(`days_of_week`, '[0,1,2,3,4,5,6]')
FROM `daily_agenda_templates`;
--> statement-breakpoint
DROP TABLE `daily_agenda_templates`;--> statement-breakpoint
ALTER TABLE `__daily_agenda_templates_new` RENAME TO `daily_agenda_templates`;--> statement-breakpoint
CREATE INDEX `daily_agenda_templates_user_range_idx` ON `daily_agenda_templates` (`user_id`,`starts_on`,`ends_on`);--> statement-breakpoint
CREATE INDEX `daily_agenda_templates_group_idx` ON `daily_agenda_templates` (`template_group_id`);--> statement-breakpoint
PRAGMA foreign_keys=ON;