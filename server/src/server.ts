import app from './app';
import { env } from '@config/env';
import fs from 'fs';
import path from 'path';

// Ensure directories exist
const dirs = ['uploads', 'generated'];
for (const dir of dirs) {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT}`);
});
