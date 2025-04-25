
import { SessionStore } from '@auth0/nextjs-auth0';
import type { Session } from '@auth0/nextjs-auth0';
import Database from '@replit/database';

const db = new Database();
const SESSION_PREFIX = 'session:';

export class ReplDBSessionStore extends SessionStore {
  async set(key: string, session: Session) {
    await db.set(`${SESSION_PREFIX}${key}`, session);
    return session;
  }

  async get(key: string) {
    return await db.get(`${SESSION_PREFIX}${key}`);
  }

  async delete(key: string) {
    await db.delete(`${SESSION_PREFIX}${key}`);
  }
}
