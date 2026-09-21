CREATE TABLE `book_pages` (
	`id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`page_number` integer NOT NULL,
	`photo_id` text,
	`caption` text,
	`page_type` text DEFAULT 'photo' NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `photo_books`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `photo_books` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`subtitle` text,
	`photographer` text NOT NULL,
	`year` integer NOT NULL,
	`description` text,
	`status` text DEFAULT 'Draft' NOT NULL,
	`visibility` text DEFAULT 'Private' NOT NULL,
	`template` text DEFAULT 'Editorial' NOT NULL,
	`page_size` text DEFAULT 'A4' NOT NULL,
	`margin_mm` integer DEFAULT 18 NOT NULL,
	`cover_photo_id` text,
	`source_issue_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`published_at` integer,
	FOREIGN KEY (`cover_photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`source_issue_id`) REFERENCES `issues`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `photo_books_slug_unique` ON `photo_books` (`slug`);