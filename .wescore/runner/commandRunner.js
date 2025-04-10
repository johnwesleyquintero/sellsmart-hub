import { spawn } from 'child_process';
import chalk from 'chalk';

export function runCommand(check, defaultTimeout) {
  return new Promise(resolve => {
    const startTime = Date.now();
    const timeoutMs = check.timeout ?? defaultTimeout;
    let output = '';
    let timedOut = false;

    const shell = process.platform === 'win32' ? 'cmd' : '/bin/sh';
    const args = process.platform === 'win32' ? ['/c', check.command] : ['-c', check.command];

    const child = spawn(shell, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
      windowsHide: true,
    });

    child.stdout.on('data', data => (output += data));
    child.stderr.on('data', data => (output += data));

    const timer = setTimeout(() => {
      timedOut = true;
      console.warn(chalk.yellow(`⏳ ${check.name} timeout after ${timeoutMs / 1000}s`));
      child.kill('SIGTERM');
      setTimeout(() => !child.killed && child.kill('SIGKILL'), 2000);
    }, timeoutMs);

    let spawnError = null;
    child.on('error', err => {
      spawnError = err;
      output += `\nSpawn Error: ${err.message}`;
      clearTimeout(timer);
    });

    child.on('close', (code, signal) => {
      clearTimeout(timer);
      resolve({
        success: code === 0 && !spawnError,
        output: output.trim(),
        exitCode: code,
        signal,
        timedOut: timedOut || ['SIGTERM', 'SIGKILL'].includes(signal),
        duration: Date.now() - startTime,
      });
    });
  });
}
