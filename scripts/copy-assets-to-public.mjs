import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve('./src/assets/crystals');
const DEST_DIR = path.resolve('./public/images/crystals');

if (!fs.existsSync(SRC_DIR)) {
  console.log('⚠️  Source directory not found:', SRC_DIR);
  process.exit(0);
}

if (!fs.existsSync(DEST_DIR)) {
  fs.mkdirSync(DEST_DIR, { recursive: true });
}

const files = fs.readdirSync(SRC_DIR).filter(f => 
  f.toLowerCase().endsWith('.png') || f.toLowerCase().endsWith('.jpg')
);

let copied = 0;
let skipped = 0;

for (const file of files) {
  const srcPath = path.join(SRC_DIR, file);
  const destPath = path.join(DEST_DIR, file);
  
  const srcStat = fs.statSync(srcPath);
  if (fs.existsSync(destPath)) {
    const destStat = fs.statSync(destPath);
    if (destStat.size === srcStat.size && destStat.mtimeMs >= srcStat.mtimeMs) {
      skipped++;
      continue;
    }
  }
  
  fs.copyFileSync(srcPath, destPath);
  copied++;
}

console.log(`✓ Copied ${copied} files, skipped ${skipped} unchanged`);