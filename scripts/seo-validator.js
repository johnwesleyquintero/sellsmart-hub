const fs = require('fs');
const path = require('path');
const { exitWithError } = require('./error-handler');
const cheerio = require('cheerio');

const REQUIRED_META_TAGS = ['description', 'og:title', 'og:description'];
const MIN_ALT_TEXT_LENGTH = 15;

async function validateSEOFiles() {
  try {
    const pagesDir = path.join(__dirname, '../app');
    const pages = fs.readdirSync(pagesDir)
      .filter(file => file.endsWith('.tsx') || file.endsWith('.mdx'));

    let errors = [];

    pages.forEach(page => {
      const content = fs.readFileSync(path.join(pagesDir, page), 'utf8');
      const $ = cheerio.load(content);

      // Meta tag validation
      REQUIRED_META_TAGS.forEach(tag => {
        if (!$(`meta[name="${tag}"], meta[property="${tag}"]`).length) {
          errors.push(`Missing required meta tag: ${tag} in ${page}`);
        }
      });

      // Image alt text validation
      $('img').each((i, el) => {
        const alt = $(el).attr('alt') || '';
        if (!alt || alt.length < MIN_ALT_TEXT_LENGTH) {
          errors.push(`Insufficient alt text (${alt.length} chars) in ${page}`);
        }
      });

      // Structured data validation
      const jsonLd = $('script[type="application/ld+json"]');
      if (!jsonLd.length) {
        errors.push(`Missing structured data in ${page}`);
      }
    });

    if (errors.length > 0) {
      console.error('SEO Validation Errors:\n' + errors.join('\n'));
      process.exit(1);
    }

    console.log('SEO validation passed successfully');
    process.exit(0);

  } catch (error) {
    exitWithError('SEO validation failed', error);
  }
}

validateSEOFiles();