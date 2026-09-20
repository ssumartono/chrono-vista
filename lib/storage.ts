import fs from 'fs';
import path from 'path';

// Define the base directory for media storage
// Ideally, this should come from settings, but for now we'll use a local folder
export const MEDIA_ROOT = path.join(process.cwd(), 'media');
export const ORIGINALS_DIR = path.join(MEDIA_ROOT, 'originals');
export const DERIVATIVES_DIR = path.join(MEDIA_ROOT, 'derivatives');

export function ensureStorageDirectories() {
  if (!fs.existsSync(MEDIA_ROOT)) fs.mkdirSync(MEDIA_ROOT, { recursive: true });
  if (!fs.existsSync(ORIGINALS_DIR)) fs.mkdirSync(ORIGINALS_DIR, { recursive: true });
  if (!fs.existsSync(DERIVATIVES_DIR)) fs.mkdirSync(DERIVATIVES_DIR, { recursive: true });
}

ensureStorageDirectories();
