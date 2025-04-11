import fs from 'fs';
import path from 'path';
import { DataValidationError } from './amazon-errors';

export async function loadStaticData<T>(filePath: string): Promise<T> {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    const fileContent = await fs.promises.readFile(fullPath, 'utf-8');
    const data = JSON.parse(fileContent) as T;

    if (!data) {
      throw new DataValidationError('Invalid data format');
    }

    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new DataValidationError('Invalid JSON format');
    }
    throw error;
  }
}
