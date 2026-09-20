import { db } from './index';
import { users } from './schema';
import * as argon2 from 'argon2';

async function seed() {
  const username = 'owner';
  const password = process.env.CHRONOVISTA_OWNER_PASSWORD;
  if (!password || password.length < 12) throw new Error('Set CHRONOVISTA_OWNER_PASSWORD (minimal 12 karakter) sebelum menjalankan seed.');

  console.log('Seeding database...');
  
  try {
    const hash = await argon2.hash(password);
    
    // Check if user exists
    const existing = db.select().from(users).get();
    
    if (!existing) {
      db.insert(users).values({
        id: 'owner-id-1234',
        username: username,
        passwordHash: hash,
        displayName: 'Fotografer',
      }).run();
      console.log('Owner user created. Username: owner.');
    } else {
      console.log('User already exists, skipping seed.');
    }
  } catch (err) {
    console.error('Failed to seed database:', err);
  }
}

seed();
