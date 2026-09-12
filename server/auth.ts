import { createHmac, randomBytes } from 'crypto';

const SALT = 'joblite_secure_salt_makurdi_2026';

export function hashPassword(password: string): string {
  return createHmac('sha256', SALT).update(password).digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateToken(): string {
  return randomBytes(32).toString('hex');
}
