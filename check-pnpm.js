const execPath = process.env.npm_execpath || '';

if (!execPath.includes('pnpm')) {
  console.error('Error: This project requires pnpm. Please use pnpm to install dependencies.');
  process.exit(1);
}

const requiredPnpmVersion = '8.15.x';
const currentPnpmVersion = process.env.npm_config_user_agent?.match(/pnpm\/([^\s]+)/)?.[1] || process.env.npm_package_packageManager?.split('@')[1];

if (!currentPnpmVersion) {
  console.error(`Error: Unable to detect pnpm version. Required version: ${requiredPnpmVersion}`);
  console.error('Please run: pnpm install -g pnpm@8.15.x');
  process.exit(1);
}

function compareVersions(v1, v2) {
  if (v2.endsWith('.x')) {
    const [major1, minor1] = v1.split('.').map(Number);
    const [major2, minor2] = v2.replace('.x', '').split('.').map(Number);
    return major1 === major2 && minor1 === minor2;
  }
  return v1 === v2;
}

if (!compareVersions(currentPnpmVersion, requiredPnpmVersion)) {
  console.error(`Error: Project requires pnpm version 8.15.x, but found ${currentPnpmVersion}`);
  console.error('Please run: pnpm install -g pnpm@8.15.x');
  process.exit(1);
}

// Success - version matches 8.15.x
process.exit(0);