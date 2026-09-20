CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`photo_id` text NOT NULL,
	`type` text NOT NULL,
	`path` text NOT NULL,
	`mime` text NOT NULL,
	`width` integer,
	`height` integer,
	`bytes` integer,
	`checksum` text,
	FOREIGN KEY (`photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`details_json` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `backups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`path` text NOT NULL,
	`bytes` integer,
	`checksum` text,
	`status` text NOT NULL,
	`schema_version` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `exif_metadata` (
	`photo_id` text PRIMARY KEY NOT NULL,
	`camera` text,
	`lens` text,
	`focal` text,
	`aperture` text,
	`shutter` text,
	`iso` integer,
	`ev` real,
	`raw_json` text,
	FOREIGN KEY (`photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `import_items` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`source_path` text NOT NULL,
	`photo_id` text,
	`status` text NOT NULL,
	`error_code` text,
	`details_json` text,
	FOREIGN KEY (`session_id`) REFERENCES `import_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `import_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`status` text NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`totals_json` text,
	`parent_id` text
);
--> statement-breakpoint
CREATE TABLE `issue_page_photos` (
	`page_id` text NOT NULL,
	`photo_id` text NOT NULL,
	`position` integer NOT NULL,
	`caption` text,
	`alt_text` text,
	PRIMARY KEY(`page_id`, `photo_id`),
	FOREIGN KEY (`page_id`) REFERENCES `issue_pages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `issue_pages` (
	`id` text PRIMARY KEY NOT NULL,
	`issue_id` text NOT NULL,
	`page_number` integer NOT NULL,
	`layout_type` text NOT NULL,
	`content_json` text,
	FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `issues` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`subtitle` text,
	`description` text,
	`status` text DEFAULT 'Draft' NOT NULL,
	`visibility` text DEFAULT 'Private' NOT NULL,
	`scheduled_at` integer,
	`published_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `issues_code_unique` ON `issues` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `issues_slug_unique` ON `issues` (`slug`);--> statement-breakpoint
CREATE TABLE `live_photos` (
	`live_session_id` text NOT NULL,
	`photo_id` text NOT NULL,
	`position` integer NOT NULL,
	PRIMARY KEY(`live_session_id`, `photo_id`),
	FOREIGN KEY (`live_session_id`) REFERENCES `live_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `live_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'Draft' NOT NULL,
	`visibility` text DEFAULT 'Private' NOT NULL,
	`started_at` integer,
	`ended_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `live_sessions_slug_unique` ON `live_sessions` (`slug`);--> statement-breakpoint
CREATE TABLE `locations` (
	`id` text PRIMARY KEY NOT NULL,
	`photo_id` text NOT NULL,
	`label` text,
	`latitude` real,
	`longitude` real,
	`precision` text,
	`visibility` text DEFAULT 'Private' NOT NULL,
	FOREIGN KEY (`photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`severity` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`action_url` text,
	`read_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `photo_tags` (
	`photo_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`photo_id`, `tag_id`),
	FOREIGN KEY (`photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`filename` text NOT NULL,
	`captured_at` integer,
	`status` text DEFAULT 'Need Review' NOT NULL,
	`visibility` text DEFAULT 'Private' NOT NULL,
	`checksum` text NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `photos_checksum_unique` ON `photos` (`checksum`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`revoked_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value_json` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_slug_unique` ON `tags` (`slug`);--> statement-breakpoint
CREATE TABLE `trash_items` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`purge_at` integer NOT NULL,
	`snapshot_json` text
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`display_name` text,
	`email` text,
	`avatar_path` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);