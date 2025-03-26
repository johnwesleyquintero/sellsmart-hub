const execPath = process.env.npm_execpath || '';
if (!execPath.includes('pnpm')) {
  console.error('Please use pnpm instead of npm or yarn.');
  process.exit(1);
}