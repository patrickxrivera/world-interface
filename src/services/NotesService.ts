import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { formatInTimeZone } from 'date-fns-tz';

export interface Note {
  id: string;
  createdAt: string;
  updatedAt: string;
  content: string;
}

export class NotesService {
  private db: Database.Database;
  private timezone: string = 'America/New_York';

  constructor(dbPath?: string) {
    // If no dbPath provided, use environment-based default
    const environment = process.env.NODE_ENV || 'development';
    const defaultPath = path.join(process.cwd(), 'data', `notes.${environment}.db`);

    this.db = new Database(dbPath || defaultPath);
    this.initializeDatabase();
  }

  private initializeDatabase() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        content TEXT NOT NULL
      )
    `);
  }

  getAllNotes(): Note[] {
    const notes = this.db.prepare('SELECT * FROM notes ORDER BY updatedAt DESC').all() as Note[];

    return notes.map((note) => ({
      ...note,
      createdAt: formatInTimeZone(
        new Date(note.createdAt),
        this.timezone,
        "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
      ),
      updatedAt: formatInTimeZone(
        new Date(note.updatedAt),
        this.timezone,
        "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
      ),
    }));
  }

  createNote(content: string): Note {
    const id = uuidv4();
    const now = new Date();
    const timestamp = formatInTimeZone(now, this.timezone, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

    this.db
      .prepare('INSERT INTO notes (id, content, createdAt, updatedAt) VALUES (?, ?, ?, ?)')
      .run(id, content, timestamp, timestamp);

    return this.db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Note;
  }

  updateNote(id: string, content: string): Note | null {
    const timestamp = formatInTimeZone(new Date(), this.timezone, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

    const result = this.db
      .prepare('UPDATE notes SET content = ?, updatedAt = ? WHERE id = ?')
      .run(content, timestamp, id);

    if (result.changes === 0) {
      return null;
    }

    const note = this.db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Note | null;
    if (!note) return null;

    return {
      ...note,
      createdAt: formatInTimeZone(
        new Date(note.createdAt),
        this.timezone,
        "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
      ),
      updatedAt: formatInTimeZone(
        new Date(note.updatedAt),
        this.timezone,
        "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
      ),
    };
  }

  deleteNote(id: string): boolean {
    const result = this.db.prepare('DELETE FROM notes WHERE id = ?').run(id);

    return result.changes > 0;
  }
}
