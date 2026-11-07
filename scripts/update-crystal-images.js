const fs = require('fs');
const path = require('path');

const IMAGES_DIR = '/home/daniel/Workdir/PersonalGithub/Crystalica/public/images/crystals';
const CONTENT_DIR = '/home/daniel/Workdir/PersonalGithub/Crystalica/src/content/crystals';

// Get all PNG files
const pngFiles = fs.readdirSync(IMAGES_DIR).filter(f => f.toLowerCase().endsWith('.png'));

let updatedCount = 0;
let skippedCount = 0;

pngFiles.forEach(pngFile => {
  const slug = path.basename(pngFile, '.png');
  const mdxPath = path.join(CONTENT_DIR, `${slug}.mdx`);
  
  if (!fs.existsSync(mdxPath)) {
    console.log(`⚠️  MDX not found for: ${pngFile} -> ${slug}.mdx`);
    skippedCount++;
    return;
  }
  
  let content = fs.readFileSync(mdxPath, 'utf8');
  
  // Check if image property already exists
  const imagePropertyRegex = /^image:\s*\/images\/crystals\/.+\.(png|jpg|jpeg)$/m;
  
  if (imagePropertyRegex.test(content)) {
    console.log(`✓ Already has image: ${slug}.mdx`);
    skippedCount++;
    return;
  }
  
  // Find the frontmatter end (--- on its own line)
  const frontmatterEndRegex = /^---$/m;
  const match = content.match(frontmatterEndRegex);
  
  if (!match) {
    console.log(`✗ No frontmatter found in: ${slug}.mdx`);
    skippedCount++;
    return;
  }
  
  // Insert image property before the closing ---
  // Find the position of the closing ---
  const firstDashMatch = content.indexOf('---');
  const secondDashMatch = content.indexOf('---', firstDashMatch + 3);
  
  if (secondDashMatch === -1) {
    console.log(`✗ Could not find closing --- in: ${slug}.mdx`);
    skippedCount++;
    return;
  }
  
  // Insert image property before closing ---
  const insertPosition = secondDashMatch;
  const imageProperty = `\nimage: /images/crystals/${pngFile}`;
  const newContent = content.slice(0, insertPosition) + imageProperty + content.slice(insertPosition);
  
  fs.writeFileSync(mdxPath, newContent);
  console.log(`✓ Added image to: ${slug}.mdx`);
  updatedCount++;
});

console.log(`\n=== Summary ===`);
console.log(`Updated: ${updatedCount}`);
console.log(`Skipped: ${skippedCount}`);