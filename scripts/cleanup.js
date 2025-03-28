const { rmSync } = require('fs');
const { join } = require('path');

const dirs = ['.next', 'out', 'node_modules'];
const root = process.cwd();

for (const dir of dirs) {
  try {
    rmSync(join(root, dir), { recursive: true, force: true });
    console.log(`Cleaned ${dir}`);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn(`Warning: Could not clean ${dir}:`, err.message);
    }
  }
}
