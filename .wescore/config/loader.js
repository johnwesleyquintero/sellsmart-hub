import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { z } from 'zod';
import { ConfigSchema, DEFAULT_COMMANDS_CONFIG, DEFAULT_COMMAND_TIMEOUT_MS } from './schema.js';

const CONFIG_FILE_PATH = path.resolve('.code-quality.json');

export async function loadConfig() {
  let loadedConfig = {};
  const configExists = fs.existsSync(CONFIG_FILE_PATH);

  if (configExists) {
    try {
      const rawConfig = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
      loadedConfig = JSON.parse(rawConfig);
    } catch (error) {
      throw new Error(`Failed to load configuration file: ${error.message}`);
    }
  }

  try {
    const finalConfig = ConfigSchema.parse(loadedConfig);
    return finalConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(chalk.red.bold('Configuration validation failed:'));
      error.errors.forEach(err => {
        console.error(chalk.red(`  - ${err.path.join('.')}: ${err.message}`));
      });
    }
    throw new Error('Invalid configuration');
  }
}
