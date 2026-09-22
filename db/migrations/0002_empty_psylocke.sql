CREATE TABLE `layout_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`page_size` text DEFAULT 'A4' NOT NULL,
	`settings_json` text NOT NULL,
	`elements_json` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
