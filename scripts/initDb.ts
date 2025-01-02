import { NotesService } from '../src/services/NotesService';
import path from 'path';
import fs from 'fs';

const initializeDatabase = (environment: string) => {
  // Ensure data directory exists
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Initialize database for the specified environment
  const dbPath = path.join(dataDir, `notes.${environment}.db`);
  console.log(`Initializing ${environment} database at: ${dbPath}`);

  new NotesService(dbPath);
  console.log(`${environment} database initialized successfully`);
};

// If script is run directly
if (require.main === module) {
  const environment = process.env.NODE_ENV || 'development';
  initializeDatabase(environment);
}

export { initializeDatabase };
