import { mkdir, copyFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const debugIndexPath = join(process.cwd(), 'dist', 'debug', 'index.html');

await mkdir(dirname(debugIndexPath), { recursive: true });
await copyFile(join(process.cwd(), 'dist', 'index.html'), debugIndexPath);
