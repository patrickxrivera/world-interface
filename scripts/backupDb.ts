import fs from 'fs';
import path from 'path';

const backupDatabase = () => {
  const environment = process.env.NODE_ENV || 'development';
  const dataDir = path.join(process.cwd(), 'data');
  const sourceFile = path.join(dataDir, `notes.${environment}.db`);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(dataDir, 'backups');
  const backupFile = path.join(backupDir, `notes.${environment}.${timestamp}.db`);

  // Ensure backup directory exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Copy database file
  fs.copyFileSync(sourceFile, backupFile);
  console.log(`Database backed up to: ${backupFile}`);
};

if (require.main === module) {
  backupDatabase();
}

export { backupDatabase };
