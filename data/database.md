# Data Directory Documentation

## Overview

This directory contains all data files used by the portfolio application, including:

- Prohibited keyword lists
- Sample CSV test data
- JSON datasets
- Changelog and version history

## File Structure

### Prohibited Keywords

Located in `prohibited-keywords/` subdirectory:

- Organized by category (e.g., health.json)
- Each file contains:
  - `keywords`: Array of prohibited terms
  - `lastUpdated`: ISO timestamp of last update

### Sample CSV Data

Located in `csv-test-data/` subdirectory:

- Sample files for various tools:
  - ACOS calculator
  - PPC campaign auditor
  - Keyword analyzer
  - Listing quality checker

### JSON Datasets

- `changelog.json`: Version history of the application
- Sample data files in `amazon-tools-sample-data/`

## Update Procedures

1. For prohibited keywords:
   - Add new terms to appropriate category file
   - Update `lastUpdated` timestamp
2. For sample data:
   - Add new CSV/JSON files to appropriate subdirectory
   - Maintain consistent naming conventions
3. Always test data changes before committing
