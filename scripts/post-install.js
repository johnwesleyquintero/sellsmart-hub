const { execSync } = require('child_process');

// Skip postinstall if flag is set
if (process.env.SKIP_POSTINSTALL) {
  console.log('Skipping postinstall scripts');
  process.exit(0);
}

try {
  // Run Sentry CLI install without failing on error
  execSync('node ./node_modules/@sentry/cli/scripts/install.js', { 
    stdio: 'inherit',
    timeout: 30000
  }).toString();
} catch (error) {
  console.warn('Sentry CLI install failed, continuing anyway');
}

try {
  // Run Speed Insights postinstall without failing on error
  execSync('node ./node_modules/@vercel/speed-insights/scripts/postinstall.mjs', {
    stdio: 'inherit',
    timeout: 30000
  }).toString();
} catch (error) {
  console.warn('Speed Insights postinstall failed, continuing anyway');
}
