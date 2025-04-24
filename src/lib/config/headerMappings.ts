// src/lib/config/headerMappings.ts

// Generated based on amazon_report.md content provided on 2024-07-26
// Source: Derived from Amazon Advertising API Documentation (Reports section)
// IMPORTANT: Review and add UI report header names manually to the 'aliases' array!

interface HeaderConfig {
  /** Internal canonical name, often based on API spec (e.g., camelCase) */
  canonicalName: string;
  /** User-friendly name for display in UI */
  displayName: string;
  /** Common names found in UI downloads (MUST BE ADDED MANUALLY) */
  aliases: string[];
  /** Definition from API docs */
  description?: string;
}

// Helper to create a basic display name from camelCase/snake_case/etc.
function formatDisplayName(name: string): string {
  if (!name) return '';
  // Handle specific cases like ASIN, ID
  if (name.toUpperCase() === 'ASIN') return 'ASIN';
  if (name.endsWith('Id')) name = name.replace('Id', ' ID');

  // Add spaces before capital letters (camelCase) and handle numbers
  let result = name.replace(/([A-Z])/g, ' $1').replace(/(\d+)/g, ' $1');
  // Replace underscores if any
  result = result.replace(/_/g, ' ');
  // Capitalize first letter and trim whitespace
  result = result.charAt(0).toUpperCase() + result.slice(1).trim();
  // Capitalize words after spaces (simple title case)
  return result
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export const reportHeaders: { [key: string]: HeaderConfig } = {
  // --- SP Report Metrics ---
  campaignName: {
    canonicalName: 'campaignName',
    displayName: formatDisplayName('campaignName'),
    aliases: [formatDisplayName('campaignName')],
    description: 'The campaign name.',
  },
  campaignId: {
    canonicalName: 'campaignId',
    displayName: formatDisplayName('campaignId'),
    aliases: [formatDisplayName('campaignId')],
    description: 'The campaign ID.',
  },
  adGroupName: {
    canonicalName: 'adGroupName',
    displayName: formatDisplayName('adGroupName'),
    aliases: [formatDisplayName('adGroupName')],
    description: 'The ad group name.',
  },
  adGroupId: {
    canonicalName: 'adGroupId',
    displayName: formatDisplayName('adGroupId'),
    aliases: [formatDisplayName('adGroupId')],
    description: 'The ad group ID.',
  },
  keywordId: {
    canonicalName: 'keywordId',
    displayName: formatDisplayName('keywordId'),
    aliases: [formatDisplayName('keywordId')],
    description: 'The keyword ID.',
  },
  keywordText: {
    canonicalName: 'keywordText',
    displayName: formatDisplayName('keywordText'),
    aliases: [formatDisplayName('keywordText')],
    description: 'The keyword text.',
  },
  productAdId: {
    canonicalName: 'productAdId',
    displayName: formatDisplayName('productAdId'),
    aliases: [formatDisplayName('productAdId')],
    description: 'The product ad ID.',
  },
  targetId: {
    canonicalName: 'targetId',
    displayName: formatDisplayName('targetId'),
    aliases: [formatDisplayName('targetId')],
    description: 'The targeting expression ID.',
  },
  targetingExpression: {
    canonicalName: 'targetingExpression',
    displayName: formatDisplayName('targetingExpression'),
    aliases: [formatDisplayName('targetingExpression')],
    description: 'The targeting expression.',
  },
  targetingText: {
    canonicalName: 'targetingText',
    displayName: formatDisplayName('targetingText'),
    aliases: [formatDisplayName('targetingText')],
    description: 'The targeting expression or keyword.',
  },
  targetingType: {
    canonicalName: 'targetingType',
    displayName: formatDisplayName('targetingType'),
    aliases: [formatDisplayName('targetingType')],
    description: 'The targeting type.',
  },
  matchType: {
    canonicalName: 'matchType',
    displayName: formatDisplayName('matchType'),
    aliases: [formatDisplayName('matchType')],
    description: 'The keyword match type.',
  },
  currency: {
    canonicalName: 'currency',
    displayName: formatDisplayName('currency'),
    aliases: [formatDisplayName('currency')],
    description: 'The currency code.',
  },
  searchTerm: {
    canonicalName: 'searchTerm',
    displayName: formatDisplayName('searchTerm'),
    aliases: [formatDisplayName('searchTerm')],
    description: 'The customer search term.',
  },
  impressions: {
    canonicalName: 'impressions',
    displayName: formatDisplayName('impressions'),
    aliases: [formatDisplayName('impressions')],
    description: 'Number of times ads were displayed.',
  },
  clicks: {
    canonicalName: 'clicks',
    displayName: formatDisplayName('clicks'),
    aliases: [formatDisplayName('clicks')],
    description: 'Number of clicks on ads.',
  },
  cost: {
    // Note: Often appears as 'Spend' in UI reports
    canonicalName: 'cost',
    displayName: formatDisplayName('cost'),
    aliases: [formatDisplayName('cost'), 'Spend'], // Added 'Spend' as a likely alias
    description:
      'Total cost of clicks (Sponsored Products) or impressions (Sponsored Display).',
  },
  attributedConversions1d: {
    canonicalName: 'attributedConversions1d',
    displayName: formatDisplayName('attributedConversions1d'),
    aliases: [formatDisplayName('attributedConversions1d')],
    description:
      'Number of attributed conversion events occurring within 1 day of click on ad.',
  },
  attributedConversions7d: {
    canonicalName: 'attributedConversions7d',
    displayName: formatDisplayName('attributedConversions7d'),
    aliases: [formatDisplayName('attributedConversions7d')],
    description:
      'Number of attributed conversion events occurring within 7 days of click on ad.',
  },
  attributedConversions14d: {
    canonicalName: 'attributedConversions14d',
    displayName: formatDisplayName('attributedConversions14d'),
    aliases: [formatDisplayName('attributedConversions14d')],
    description:
      'Number of attributed conversion events occurring within 14 days of click on ad.',
  },
  attributedConversions30d: {
    canonicalName: 'attributedConversions30d',
    displayName: formatDisplayName('attributedConversions30d'),
    aliases: [formatDisplayName('attributedConversions30d')],
    description:
      'Number of attributed conversion events occurring within 30 days of click on ad.',
  },
  attributedConversions1dSameSKU: {
    canonicalName: 'attributedConversions1dSameSKU',
    displayName: formatDisplayName('attributedConversions1dSameSKU'),
    aliases: [formatDisplayName('attributedConversions1dSameSKU')],
    description:
      'Number of attributed conversion events for the same SKU occurring within 1 day of click on ad.',
  },
  attributedConversions7dSameSKU: {
    canonicalName: 'attributedConversions7dSameSKU',
    displayName: formatDisplayName('attributedConversions7dSameSKU'),
    aliases: [formatDisplayName('attributedConversions7dSameSKU')],
    description:
      'Number of attributed conversion events for the same SKU occurring within 7 days of click on ad.',
  },
  attributedConversions14dSameSKU: {
    canonicalName: 'attributedConversions14dSameSKU',
    displayName: formatDisplayName('attributedConversions14dSameSKU'),
    aliases: [formatDisplayName('attributedConversions14dSameSKU')],
    description:
      'Number of attributed conversion events for the same SKU occurring within 14 days of click on ad.',
  },
  attributedConversions30dSameSKU: {
    canonicalName: 'attributedConversions30dSameSKU',
    displayName: formatDisplayName('attributedConversions30dSameSKU'),
    aliases: [formatDisplayName('attributedConversions30dSameSKU')],
    description:
      'Number of attributed conversion events for the same SKU occurring within 30 days of click on ad.',
  },
  attributedUnitsOrdered1d: {
    canonicalName: 'attributedUnitsOrdered1d',
    displayName: formatDisplayName('attributedUnitsOrdered1d'),
    aliases: [formatDisplayName('attributedUnitsOrdered1d')],
    description:
      'Number of units ordered occurring within 1 day of click on ad.',
  },
  attributedUnitsOrdered7d: {
    canonicalName: 'attributedUnitsOrdered7d',
    displayName: formatDisplayName('attributedUnitsOrdered7d'),
    aliases: [formatDisplayName('attributedUnitsOrdered7d')],
    description:
      'Number of units ordered occurring within 7 days of click on ad.',
  },
  attributedUnitsOrdered14d: {
    canonicalName: 'attributedUnitsOrdered14d',
    displayName: formatDisplayName('attributedUnitsOrdered14d'),
    aliases: [formatDisplayName('attributedUnitsOrdered14d')],
    description:
      'Number of units ordered occurring within 14 days of click on ad.',
  },
  attributedUnitsOrdered30d: {
    canonicalName: 'attributedUnitsOrdered30d',
    displayName: formatDisplayName('attributedUnitsOrdered30d'),
    aliases: [formatDisplayName('attributedUnitsOrdered30d')],
    description:
      'Number of units ordered occurring within 30 days of click on ad.',
  },
  attributedSales1d: {
    canonicalName: 'attributedSales1d',
    displayName: formatDisplayName('attributedSales1d'),
    aliases: [formatDisplayName('attributedSales1d')],
    description: 'Total sales occurring within 1 day of click on ad.',
  },
  attributedSales7d: {
    canonicalName: 'attributedSales7d',
    displayName: formatDisplayName('attributedSales7d'),
    aliases: [formatDisplayName('attributedSales7d')],
    description: 'Total sales occurring within 7 days of click on ad.',
  },
  attributedSales14d: {
    // Note: Often appears as 'Sales' or 'Total Sales' in UI reports
    canonicalName: 'attributedSales14d',
    displayName: formatDisplayName('attributedSales14d'),
    aliases: [
      formatDisplayName('attributedSales14d'),
      'Sales',
      'Total Sales (14 days)',
    ], // Added likely aliases
    description: 'Total sales occurring within 14 days of click on ad.',
  },
  attributedSales30d: {
    canonicalName: 'attributedSales30d',
    displayName: formatDisplayName('attributedSales30d'),
    aliases: [formatDisplayName('attributedSales30d')],
    description: 'Total sales occurring within 30 days of click on ad.',
  },
  attributedSales1dSameSKU: {
    canonicalName: 'attributedSales1dSameSKU',
    displayName: formatDisplayName('attributedSales1dSameSKU'),
    aliases: [formatDisplayName('attributedSales1dSameSKU')],
    description:
      'Total sales for the same SKU occurring within 1 day of click on ad.',
  },
  attributedSales7dSameSKU: {
    canonicalName: 'attributedSales7dSameSKU',
    displayName: formatDisplayName('attributedSales7dSameSKU'),
    aliases: [formatDisplayName('attributedSales7dSameSKU')],
    description:
      'Total sales for the same SKU occurring within 7 days of click on ad.',
  },
  attributedSales14dSameSKU: {
    canonicalName: 'attributedSales14dSameSKU',
    displayName: formatDisplayName('attributedSales14dSameSKU'),
    aliases: [formatDisplayName('attributedSales14dSameSKU')],
    description:
      'Total sales for the same SKU occurring within 14 days of click on ad.',
  },
  attributedSales30dSameSKU: {
    canonicalName: 'attributedSales30dSameSKU',
    displayName: formatDisplayName('attributedSales30dSameSKU'),
    aliases: [formatDisplayName('attributedSales30dSameSKU')],
    description:
      'Total sales for the same SKU occurring within 30 days of click on ad.',
  },
  attributedUnitsOrdered1dSameSKU: {
    canonicalName: 'attributedUnitsOrdered1dSameSKU',
    displayName: formatDisplayName('attributedUnitsOrdered1dSameSKU'),
    aliases: [formatDisplayName('attributedUnitsOrdered1dSameSKU')],
    description:
      'Number of units ordered for the same SKU occurring within 1 day of click on ad.',
  },
  attributedUnitsOrdered7dSameSKU: {
    canonicalName: 'attributedUnitsOrdered7dSameSKU',
    displayName: formatDisplayName('attributedUnitsOrdered7dSameSKU'),
    aliases: [formatDisplayName('attributedUnitsOrdered7dSameSKU')],
    description:
      'Number of units ordered for the same SKU occurring within 7 days of click on ad.',
  },
  attributedUnitsOrdered14dSameSKU: {
    canonicalName: 'attributedUnitsOrdered14dSameSKU',
    displayName: formatDisplayName('attributedUnitsOrdered14dSameSKU'),
    aliases: [formatDisplayName('attributedUnitsOrdered14dSameSKU')],
    description:
      'Number of units ordered for the same SKU occurring within 14 days of click on ad.',
  },
  attributedUnitsOrdered30dSameSKU: {
    canonicalName: 'attributedUnitsOrdered30dSameSKU',
    displayName: formatDisplayName('attributedUnitsOrdered30dSameSKU'),
    aliases: [formatDisplayName('attributedUnitsOrdered30dSameSKU')],
    description:
      'Number of units ordered for the same SKU occurring within 30 days of click on ad.',
  },

  // --- SB Report Metrics ---
  // Note: Some metrics might overlap with SP, ensure consistency or handle specific SB versions if needed
  attributedDetailPageViewsClicks14d: {
    canonicalName: 'attributedDetailPageViewsClicks14d',
    displayName: formatDisplayName('attributedDetailPageViewsClicks14d'),
    aliases: [formatDisplayName('attributedDetailPageViewsClicks14d')],
    description:
      'Number of detail page views occurring within 14 days of click on ad.',
  },
  attributedOrdersNewToBrand14d: {
    canonicalName: 'attributedOrdersNewToBrand14d',
    displayName: formatDisplayName('attributedOrdersNewToBrand14d'),
    aliases: [formatDisplayName('attributedOrdersNewToBrand14d')],
    description:
      'Number of orders from new-to-brand customers occurring within 14 days of click on ad.',
  },
  attributedSalesNewToBrand14d: {
    canonicalName: 'attributedSalesNewToBrand14d',
    displayName: formatDisplayName('attributedSalesNewToBrand14d'),
    aliases: [formatDisplayName('attributedSalesNewToBrand14d')],
    description:
      'Total sales from new-to-brand customers occurring within 14 days of click on ad.',
  },
  attributedUnitsOrderedNewToBrand14d: {
    canonicalName: 'attributedUnitsOrderedNewToBrand14d',
    displayName: formatDisplayName('attributedUnitsOrderedNewToBrand14d'),
    aliases: [formatDisplayName('attributedUnitsOrderedNewToBrand14d')],
    description:
      'Number of units ordered from new-to-brand customers occurring within 14 days of click on ad.',
  },
  attributedBrandedSearches14d: {
    canonicalName: 'attributedBrandedSearches14d',
    displayName: formatDisplayName('attributedBrandedSearches14d'),
    aliases: [formatDisplayName('attributedBrandedSearches14d')],
    description:
      'Number of attributed branded searches occurring within 14 days of click on ad.',
  },
  viewImpressions: {
    canonicalName: 'viewImpressions',
    displayName: formatDisplayName('viewImpressions'),
    aliases: [formatDisplayName('viewImpressions')],
    description: 'Number of viewable impressions.',
  },
  viewAttributedConversions14d: {
    canonicalName: 'viewAttributedConversions14d',
    displayName: formatDisplayName('viewAttributedConversions14d'),
    aliases: [formatDisplayName('viewAttributedConversions14d')],
    description:
      'Number of view-attributed conversion events occurring within 14 days of ad view.',
  },
  viewAttributedUnitsOrdered14d: {
    canonicalName: 'viewAttributedUnitsOrdered14d',
    displayName: formatDisplayName('viewAttributedUnitsOrdered14d'),
    aliases: [formatDisplayName('viewAttributedUnitsOrdered14d')],
    description:
      'Number of view-attributed units ordered occurring within 14 days of ad view.',
  },
  viewAttributedSales14d: {
    canonicalName: 'viewAttributedSales14d',
    displayName: formatDisplayName('viewAttributedSales14d'),
    aliases: [formatDisplayName('viewAttributedSales14d')],
    description:
      'Total view-attributed sales occurring within 14 days of ad view.',
  },
  viewAttributedOrdersNewToBrand14d: {
    canonicalName: 'viewAttributedOrdersNewToBrand14d',
    displayName: formatDisplayName('viewAttributedOrdersNewToBrand14d'),
    aliases: [formatDisplayName('viewAttributedOrdersNewToBrand14d')],
    description:
      'Number of view-attributed orders from new-to-brand customers occurring within 14 days of ad view.',
  },
  viewAttributedSalesNewToBrand14d: {
    canonicalName: 'viewAttributedSalesNewToBrand14d',
    displayName: formatDisplayName('viewAttributedSalesNewToBrand14d'),
    aliases: [formatDisplayName('viewAttributedSalesNewToBrand14d')],
    description:
      'Total view-attributed sales from new-to-brand customers occurring within 14 days of ad view.',
  },
  viewAttributedUnitsOrderedNewToBrand14d: {
    canonicalName: 'viewAttributedUnitsOrderedNewToBrand14d',
    displayName: formatDisplayName('viewAttributedUnitsOrderedNewToBrand14d'),
    aliases: [formatDisplayName('viewAttributedUnitsOrderedNewToBrand14d')],
    description:
      'Number of view-attributed units ordered from new-to-brand customers occurring within 14 days of ad view.',
  },

  // --- Potentially Missing / Add Manually ---
  // Add entries for Business Report metrics like 'sessions', 'pageViews', 'buyBoxPercentage' etc.
  // These need to be defined based on downloaded Business Reports as they aren't typically in the Ad API report docs.
  date: {
    // Added common 'date' field
    canonicalName: 'date',
    displayName: 'Date',
    aliases: ['Date', 'Day'],
    description: 'The date of the record (YYYY-MM-DD format preferred).',
  },
  asin: {
    // Added common 'asin' field
    canonicalName: 'asin',
    displayName: 'ASIN',
    aliases: ['ASIN', '(Parent) ASIN', '(Child) ASIN'],
    description: 'Amazon Standard Identification Number.',
  },
  sku: {
    // Added common 'sku' field
    canonicalName: 'sku',
    displayName: 'SKU',
    aliases: ['SKU', 'Seller SKU'],
    description: 'Stock Keeping Unit.',
  },
  sessions: {
    // Placeholder for Business Report metric
    canonicalName: 'sessions',
    displayName: 'Sessions',
    aliases: ['Sessions', 'Visits'],
    description:
      'Number of unique visits to product pages (typically from Business Reports).',
  },
  pageViews: {
    // Placeholder for Business Report metric
    canonicalName: 'pageViews',
    displayName: 'Page Views',
    aliases: ['Page Views'],
    description:
      'Total number of times product pages were viewed (typically from Business Reports).',
  },
  buyBoxPercentage: {
    // Placeholder for Business Report metric
    canonicalName: 'buyBoxPercentage',
    displayName: 'Buy Box Percentage',
    aliases: ['Buy Box Percentage', 'Buy Box %'],
    description:
      'Percentage of time you owned the Buy Box when the product page was viewed (typically from Business Reports).',
  },
  unitsOrdered: {
    // Placeholder for Business Report metric (Total, not attributed)
    canonicalName: 'unitsOrdered',
    displayName: 'Units Ordered',
    aliases: ['Units Ordered', 'Total Units Ordered'],
    description:
      'Total number of units ordered for the product (typically from Business Reports).',
  },
};

/**
 * Finds the canonical name for a given header string by checking aliases.
 * Case-insensitive and trims whitespace.
 * @param header The header string from the CSV file.
 * @returns The canonical name if found, otherwise null.
 */
export function findCanonicalName(header: string): string | null {
  if (!header) return null;
  const lowerHeader = header.toLowerCase().trim();
  for (const key in reportHeaders) {
    const config = reportHeaders[key];
    // Check canonical name first (less likely to match directly with UI headers)
    // if (config.canonicalName.toLowerCase() === lowerHeader) {
    //   return config.canonicalName;
    // }
    // Check aliases
    if (config.aliases.some((alias) => alias.toLowerCase() === lowerHeader)) {
      return config.canonicalName;
    }
  }
  // Fallback: Check if the input header directly matches a canonical name (case-insensitive)
  // This helps if an alias wasn't added but the canonical name itself is used (e.g., 'impressions')
  for (const key in reportHeaders) {
    const config = reportHeaders[key];
    if (config.canonicalName.toLowerCase() === lowerHeader) {
      return config.canonicalName;
    }
  }

  return null;
}

/**
 * Gets the display name for a given canonical name.
 * @param canonicalName The internal canonical name.
 * @returns The user-friendly display name, or the canonical name if not found.
 */
export function getDisplayName(canonicalName: string): string {
  const config = Object.values(reportHeaders).find(
    (c) => c.canonicalName === canonicalName,
  );
  return config?.displayName || canonicalName;
}
