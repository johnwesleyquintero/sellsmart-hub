const execPath = process.env.npm_execpath || '';
console.log('[DEBUG] Detected package manager path:', execPath);

if (!execPath.includes('pnpm')) {
  console.error('Error: This project requires pnpm. Please use pnpm to install dependencies.');
  process.exit(1);
}

const requiredPnpmVersion = '8.15.3';
const currentPnpmVersion = process.env.npm_config_user_agent?.match(/pnpm\/([^\s]+)/)?.[1];

if (!currentPnpmVersion) {
  console.error(`Error: Unable to detect pnpm version. Required version: ${requiredPnpmVersion}`);
  process.exit(1);
}

if (currentPnpmVersion !== requiredPnpmVersion) {
  console.error(`Error: Project requires pnpm version ${requiredPnpmVersion}, but found ${currentPnpmVersion}`);
  console.error('Please run: npm install -g pnpm@8.15.3');
  process.exit(1);
}