const fs = require('fs');
const path = require('path');

const dirsToClean = ['.next', 'out', 'node_modules'];

function cleanDir(dir) {
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`✓ Cleaned ${dir}`);
    }
  } catch (err) {
    console.warn(`⚠ Warning: Could not clean ${dir}:`, err.message);
  }
}

dirsToClean.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  cleanDir(fullPath);
});
