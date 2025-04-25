import Database from '@replit/database';
import { SessionData, SessionDataStore } from '@auth0/nextjs-auth0/types';

const db = new Database();
const SESSION_PREFIX = 'session:';

export class ReplDBSessionStore implements SessionDataStore {
  async get(id: string): Promise<SessionData | null> {
    const result = await db.get(`${SESSION_PREFIX}${id}`);
    if (result.ok) { // Check if the result is a successful retrieval
      return result.value as SessionData; // Return the SessionData contained in a successful result
    } else {
      // Handle the error or return null as appropriate for your application logic
      return null;
    }
  }

  async set(id: string, session: SessionData): Promise<void> {
    await db.set(`${SESSION_PREFIX}${id}`, session);
  }

  async delete(id: string): Promise<void> {
    await db.delete(`${SESSION_PREFIX}${id}`);
  }
}
