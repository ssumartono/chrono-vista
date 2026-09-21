import { sqliteTable, text, integer, real, primaryKey } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // uuid
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name'),
  email: text('email'),
  avatarPath: text('avatar_path'),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  revokedAt: integer('revoked_at', { mode: 'timestamp' }),
});

export const photos = sqliteTable('photos', {
  id: text('id').primaryKey(),
  filename: text('filename').notNull(),
  capturedAt: integer('captured_at', { mode: 'timestamp' }),
  status: text('status').notNull().default('Need Review'), // e.g. Need Review, Ready, Private
  visibility: text('visibility').notNull().default('Private'), // e.g. Private, Public
  checksum: text('checksum').notNull().unique(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});

export const assets = sqliteTable('assets', {
  id: text('id').primaryKey(),
  photoId: text('photo_id').notNull().references(() => photos.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // e.g. original, thumbnail, viewer, cover
  path: text('path').notNull(),
  mime: text('mime').notNull(),
  width: integer('width'),
  height: integer('height'),
  bytes: integer('bytes'),
  checksum: text('checksum'),
});

export const exifMetadata = sqliteTable('exif_metadata', {
  photoId: text('photo_id').primaryKey().references(() => photos.id, { onDelete: 'cascade' }),
  camera: text('camera'),
  lens: text('lens'),
  focal: text('focal'),
  aperture: text('aperture'),
  shutter: text('shutter'),
  iso: integer('iso'),
  ev: real('ev'),
  rawJson: text('raw_json'),
});

export const locations = sqliteTable('locations', {
  id: text('id').primaryKey(),
  photoId: text('photo_id').notNull().references(() => photos.id, { onDelete: 'cascade' }),
  label: text('label'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  precision: text('precision'), // e.g. exact, approximate, city
  visibility: text('visibility').notNull().default('Private'),
});

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
});

export const photoTags = sqliteTable('photo_tags', {
  photoId: text('photo_id').notNull().references(() => photos.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (t) => [primaryKey({ columns: [t.photoId, t.tagId] })]);

export const issues = sqliteTable('issues', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  description: text('description'),
  status: text('status').notNull().default('Draft'), // Draft, Scheduled, Published, Unpublished, Archived
  visibility: text('visibility').notNull().default('Private'),
  scheduledAt: integer('scheduled_at', { mode: 'timestamp' }),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
});

export const issuePages = sqliteTable('issue_pages', {
  id: text('id').primaryKey(),
  issueId: text('issue_id').notNull().references(() => issues.id, { onDelete: 'cascade' }),
  pageNumber: integer('page_number').notNull(),
  layoutType: text('layout_type').notNull(),
  contentJson: text('content_json'),
});

export const issuePagePhotos = sqliteTable('issue_page_photos', {
  pageId: text('page_id').notNull().references(() => issuePages.id, { onDelete: 'cascade' }),
  photoId: text('photo_id').notNull().references(() => photos.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  caption: text('caption'),
  altText: text('alt_text'),
}, (t) => [primaryKey({ columns: [t.pageId, t.photoId] })]);

export const photoBooks = sqliteTable('photo_books', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  photographer: text('photographer').notNull(),
  year: integer('year').notNull(),
  description: text('description'),
  status: text('status').notNull().default('Draft'),
  visibility: text('visibility').notNull().default('Private'),
  template: text('template').notNull().default('Editorial'),
  pageSize: text('page_size').notNull().default('A4'),
  marginMm: integer('margin_mm').notNull().default(18),
  coverPhotoId: text('cover_photo_id').references(() => photos.id, { onDelete: 'set null' }),
  sourceIssueId: text('source_issue_id').references(() => issues.id, { onDelete: 'set null' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
});

export const bookPages = sqliteTable('book_pages', {
  id: text('id').primaryKey(),
  bookId: text('book_id').notNull().references(() => photoBooks.id, { onDelete: 'cascade' }),
  pageNumber: integer('page_number').notNull(),
  photoId: text('photo_id').references(() => photos.id, { onDelete: 'set null' }),
  caption: text('caption'),
  pageType: text('page_type').notNull().default('photo'),
});

export const liveSessions = sqliteTable('live_sessions', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  status: text('status').notNull().default('Draft'),
  visibility: text('visibility').notNull().default('Private'),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  endedAt: integer('ended_at', { mode: 'timestamp' }),
});

export const livePhotos = sqliteTable('live_photos', {
  liveSessionId: text('live_session_id').notNull().references(() => liveSessions.id, { onDelete: 'cascade' }),
  photoId: text('photo_id').notNull().references(() => photos.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
}, (t) => [primaryKey({ columns: [t.liveSessionId, t.photoId] })]);

export const importSessions = sqliteTable('import_sessions', {
  id: text('id').primaryKey(),
  source: text('source').notNull(),
  status: text('status').notNull(),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  totalsJson: text('totals_json'),
  parentId: text('parent_id'),
});

export const importItems = sqliteTable('import_items', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => importSessions.id, { onDelete: 'cascade' }),
  sourcePath: text('source_path').notNull(),
  photoId: text('photo_id').references(() => photos.id, { onDelete: 'set null' }),
  status: text('status').notNull(),
  errorCode: text('error_code'),
  detailsJson: text('details_json'),
});

export const backups = sqliteTable('backups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  path: text('path').notNull(),
  bytes: integer('bytes'),
  checksum: text('checksum'),
  status: text('status').notNull(),
  schemaVersion: text('schema_version'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  category: text('category').notNull(),
  severity: text('severity').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  actionUrl: text('action_url'),
  readAt: integer('read_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  valueJson: text('value_json').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  actorId: text('actor_id'),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  detailsJson: text('details_json'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const trashItems = sqliteTable('trash_items', {
  id: text('id').primaryKey(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  purgeAt: integer('purge_at', { mode: 'timestamp' }).notNull(),
  snapshotJson: text('snapshot_json'),
});
