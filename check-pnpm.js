const execPath = process.env.npm_execpath || '';
console.log('[DEBUG] Detected package manager path:', execPath);
if (!execPath.includes('pnpm')) {
  console.warn('Warning: Recommend using pnpm instead of npm/yarn');
  // process.exit(1);
}