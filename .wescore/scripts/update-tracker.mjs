// .wescore/scripts/update-tracker.mjs
// Purpose: Automates moving completed tasks '[x]' in project-tracker.mdx
//          to the 'COMPLETED TASKS' section, preserving original section context.

import chalk from 'chalk'; // Optional: for styled console output
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

// === CONFIGURATION ===
const TRACKER_FILENAME = 'src/app/content/blog/project-tracker.mdx'; // Path relative to project root
const TRACKER_PATH = path.resolve(process.cwd(), TRACKER_FILENAME);
const COMPLETED_SECTION_HEADING = '## COMPLETED TASKS';
const COMPLETED_SUBHEADING_PREFIX = '### Completed: ';

// === STYLING (Optional - adapt from check-quality.mjs if desired) ===
const C = {
  success: chalk.green,
  info: chalk.blue,
  warn: chalk.yellow,
  error: chalk.red,
  bold: chalk.bold,
  dim: chalk.dim,
  filePath: chalk.cyan,
  heading: chalk.magenta,
};

// === HELPER FUNCTION ===
function log(level, message) {
  const colorFn = C[level] || C.info;
  console.log(colorFn(`[${level.toUpperCase()}] ${message}`));
}

// === CORE LOGIC ===

/**
 * Reads the tracker file, processes completed tasks, and writes back the updated content.
 */
async function updateProjectTracker() {
  log(
    'info',
    `Starting project tracker update for: ${C.filePath(TRACKER_PATH)}`,
  );

  let fileContent;
  try {
    fileContent = await fs.readFile(TRACKER_PATH, 'utf-8');
    log('success', 'Successfully read tracker file.');
  } catch (error) {
    if (error.code === 'ENOENT') {
      log('error', `Tracker file not found at ${C.filePath(TRACKER_PATH)}.`);
    } else {
      log('error', `Error reading tracker file: ${error.message}`);
      console.error(error); // Log full error for debugging
    }
    process.exit(1); // Exit if file cannot be read
  }

  const lines = fileContent.split('\n');
  const completedTasksBySection = new Map(); // Map<string, string[]> -> { "Section Name": ["- [x] Task 1", "- [x] Task 2"] }
  const linesToRemove = new Set(); // Set<number> -> Indices of lines to remove
  let currentSectionHeading = 'Uncategorized'; // Default if task found before first heading
  let completedSectionStartIndex = -1;
  let completedSectionEndIndex = lines.length; // Assume it goes to the end unless another H2 is found

  // --- Pass 1: Identify completed tasks and the completed section boundaries ---
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Find the start of the target completed section
    if (line.startsWith(COMPLETED_SECTION_HEADING)) {
      completedSectionStartIndex = i;
      // Look for the *next* H2 heading to define the end boundary
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim().startsWith('## ')) {
          completedSectionEndIndex = j;
          break;
        }
      }
      log(
        'info',
        `Found '${COMPLETED_SECTION_HEADING}' starting at line ${i + 1}.`,
      );
      continue; // Don't process tasks within this section yet
    }

    // If we are *before* the completed section starts (or if it doesn't exist)
    if (completedSectionStartIndex === -1 || i < completedSectionStartIndex) {
      // Update current section heading (Level 3 assumed for task context)
      if (line.startsWith('### ')) {
        currentSectionHeading = line.substring(4).trim(); // Get heading text
        log(
          'info',
          `Processing under section: ${C.heading(currentSectionHeading)}`,
        );
      }
      // Check for completed task marker
      else if (line.startsWith('- [x]')) {
        log('info', `Found completed task: ${C.dim(line)}`);
        if (!completedTasksBySection.has(currentSectionHeading)) {
          completedTasksBySection.set(currentSectionHeading, []);
        }
        completedTasksBySection.get(currentSectionHeading).push(lines[i]); // Store original line with indentation
        linesToRemove.add(i); // Mark this line index for removal
      }
    }
  }

  if (completedTasksBySection.size === 0) {
    log(
      'warn',
      'No new completed tasks found to move. File remains unchanged.',
    );
    return; // Nothing to do
  }

  log(
    'success',
    `Found ${C.bold(completedTasksBySection.size)} sections with new completed tasks.`,
  );

  // --- Pass 2: Construct the new file content ---
  const newLines = [];

  // Add lines before the completed section, skipping removed ones
  for (
    let i = 0;
    i <
    (completedSectionStartIndex === -1
      ? lines.length
      : completedSectionStartIndex);
    i++
  ) {
    if (!linesToRemove.has(i)) {
      newLines.push(lines[i]);
    }
  }

  // Ensure the COMPLETED_SECTION_HEADING exists
  if (completedSectionStartIndex === -1) {
    log('warn', `'${COMPLETED_SECTION_HEADING}' not found. Appending it.`);
    if (newLines.length > 0 && newLines[newLines.length - 1].trim() !== '') {
      newLines.push(''); // Add a blank line before the new section if needed
    }
    newLines.push(COMPLETED_SECTION_HEADING);
    newLines.push(''); // Add a blank line after the heading
    completedSectionStartIndex = newLines.length - 2; // Update index for insertion point
    completedSectionEndIndex = newLines.length; // It's now at the end
  } else {
    // Add the original completed section heading line
    newLines.push(lines[completedSectionStartIndex]);
  }

  // --- Insert the newly completed tasks ---
  const tasksToInsert = [];
  for (const [section, tasks] of completedTasksBySection.entries()) {
    tasksToInsert.push(''); // Blank line before section
    tasksToInsert.push(`${COMPLETED_SUBHEADING_PREFIX}${section}`); // Add "### Completed: Section Name"
    tasks.forEach((task) => tasksToInsert.push(task)); // Add the tasks
  }

  // Find the correct insertion point within the completed section
  // Usually, just after the main heading, but before existing content or the next H2
  const insertionPoint = completedSectionStartIndex + 1; // Insert right after the '## COMPLETED TASKS' line
  newLines.splice(insertionPoint, 0, ...tasksToInsert);

  // Add any *existing* content from the original completed section
  // (Adjust indices because we inserted lines)
  const adjustedCompletedSectionEndIndex =
    completedSectionStartIndex +
    (completedSectionEndIndex - completedSectionStartIndex);
  for (
    let i = completedSectionStartIndex + 1;
    i < adjustedCompletedSectionEndIndex;
    i++
  ) {
    // Only add original lines if they weren't part of the *newly* inserted block
    // This check is tricky, might be simpler to just append original content *after* new stuff
    // Let's try appending existing content *after* the new stuff for simplicity:
    // We already added lines *before* the completed section.
    // We added the completed section heading.
    // We spliced in the *new* completed tasks.
    // Now, add the *original* lines that were between the completed heading and the next H2 (or EOF).
  }
  // --- Simpler Approach: Append original completed content *after* new ---
  // (Rebuild newLines up to the insertion point)
  const finalNewLines = [];
  for (
    let i = 0;
    i <
    (completedSectionStartIndex === -1
      ? lines.length
      : completedSectionStartIndex);
    i++
  ) {
    if (!linesToRemove.has(i)) {
      finalNewLines.push(lines[i]);
    }
  }
  // Add heading (create if needed)
  if (completedSectionStartIndex === -1) {
    if (
      finalNewLines.length > 0 &&
      finalNewLines[finalNewLines.length - 1].trim() !== ''
    )
      finalNewLines.push('');
    finalNewLines.push(COMPLETED_SECTION_HEADING);
    if (
      finalNewLines.length > 0 &&
      finalNewLines[finalNewLines.length - 1].trim() !== ''
    )
      finalNewLines.push(''); // Ensure blank line after heading
  } else {
    finalNewLines.push(lines[completedSectionStartIndex]);
  }

  // Add the *newly* completed tasks, formatted
  for (const [section, tasks] of completedTasksBySection.entries()) {
    finalNewLines.push('');
    finalNewLines.push(`${COMPLETED_SUBHEADING_PREFIX}${section}`);
    tasks.forEach((task) => finalNewLines.push(task));
  }

  // Add the *original* content from the completed section (if it existed)
  if (completedSectionStartIndex !== -1) {
    for (
      let i = completedSectionStartIndex + 1;
      i < completedSectionEndIndex;
      i++
    ) {
      finalNewLines.push(lines[i]);
    }
  }

  // Add lines *after* the original completed section (if any)
  for (let i = completedSectionEndIndex; i < lines.length; i++) {
    if (!linesToRemove.has(i)) {
      // Should not happen if logic is correct, but safe check
      finalNewLines.push(lines[i]);
    }
  }

  // --- Write the updated content back ---
  const finalContent = finalNewLines.join('\n');

  // Optional: Check if content actually changed to avoid unnecessary writes
  if (finalContent === fileContent) {
    log(
      'warn',
      'File content did not change after processing. No write needed.',
    );
    return;
  }

  try {
    await fs.writeFile(TRACKER_PATH, finalContent, 'utf-8');
    log(
      'success',
      `Successfully updated tracker file: ${C.filePath(TRACKER_PATH)}`,
    );
  } catch (error) {
    log('error', `Error writing updated tracker file: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// === SCRIPT ENTRY POINT ===
updateProjectTracker();
