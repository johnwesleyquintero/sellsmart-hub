import chalk from 'chalk';

export function categorizeError(output, errorCategories) {
  if (!output || !errorCategories) return {};

  for (const [categoryName, category] of Object.entries(errorCategories)) {
    for (const pattern of category.patterns || []) {
      try {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(output)) {
          return {
            category: categoryName,
            suggestion: category.suggestion,
          };
        }
      } catch (e) {
        console.warn(chalk.yellow(`Invalid regex pattern: ${pattern}`));
      }
    }
  }
  return {};
}
