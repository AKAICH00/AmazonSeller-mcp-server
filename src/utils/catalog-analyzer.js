import { makeSpApiRequest } from './auth.js';

/**
 * Get all seller listings in a human-readable format
 * @param {object} options - Options for listing retrieval
 * @returns {Promise<object>} - Analyzed listings with plain English descriptions
 */
export async function analyzeCatalog(options = {}) {
  const {
    marketplaceId = process.env.SP_API_MARKETPLACE_ID,
    includeInactive = false
  } = options;

  console.log('📦 Fetching your catalog listings...\n');

  try {
    // Get all merchant listings
    const reportResult = await generateListingsReport(marketplaceId, includeInactive);

    if (!reportResult.success) {
      return {
        success: false,
        error: reportResult.error
      };
    }

    console.log('📊 Analyzing listings...\n');

    // Parse and analyze the listings
    const analysis = parseListingsData(reportResult.data);

    return {
      success: true,
      analysis,
      rawData: reportResult.data
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get detailed information about specific listing(s)
 * @param {string|array} skus - SKU or array of SKUs
 * @returns {Promise<object>} - Detailed listing information
 */
export async function getListingDetails(skus) {
  const skuArray = Array.isArray(skus) ? skus : [skus];
  const results = [];

  console.log(`🔍 Getting details for ${skuArray.length} listing(s)...\n`);

  for (const sku of skuArray) {
    try {
      const listing = await makeSpApiRequest(
        'GET',
        `/listings/2021-08-01/items/${encodeURIComponent(process.env.SP_API_SELLER_ID || 'default')}/${encodeURIComponent(sku)}`,
        null,
        {
          marketplaceIds: process.env.SP_API_MARKETPLACE_ID,
          includedData: 'summaries,attributes,issues,offers,fulfillmentAvailability,procurement'
        }
      );

      const analysis = analyzeListingDetail(listing, sku);
      results.push(analysis);

    } catch (error) {
      results.push({
        sku,
        success: false,
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Generate a listings report and download it
 * @param {string} marketplaceId - Marketplace ID
 * @param {boolean} includeInactive - Include inactive listings
 * @returns {Promise<object>} - Report data
 */
async function generateListingsReport(marketplaceId, includeInactive) {
  console.log('📄 Generating listings report...');

  const reportType = includeInactive
    ? 'GET_MERCHANT_LISTINGS_ALL_DATA'
    : 'GET_MERCHANT_LISTINGS_DATA';

  try {
    // Create report
    const createResponse = await makeSpApiRequest(
      'POST',
      '/reports/2021-06-30/reports',
      {
        reportType,
        marketplaceIds: [marketplaceId]
      }
    );

    const reportId = createResponse.reportId;
    console.log(`Report ID: ${reportId}`);
    console.log('⏳ Waiting for report to process...');

    // Poll for completion
    let report;
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second intervals

      report = await makeSpApiRequest(
        'GET',
        `/reports/2021-06-30/reports/${reportId}`
      );

      if (report.processingStatus === 'DONE') {
        console.log('✅ Report ready!\n');
        break;
      } else if (report.processingStatus === 'FATAL' || report.processingStatus === 'CANCELLED') {
        return {
          success: false,
          error: `Report processing ${report.processingStatus.toLowerCase()}`
        };
      }

      process.stdout.write('.');
    }

    if (report.processingStatus !== 'DONE') {
      return {
        success: false,
        error: 'Report generation timed out'
      };
    }

    // Get document
    const documentId = report.reportDocumentId;
    const document = await makeSpApiRequest(
      'GET',
      `/reports/2021-06-30/documents/${documentId}`
    );

    // Download report data
    const axios = (await import('axios')).default;
    const response = await axios.get(document.url);

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Parse listings report data into structured format
 * @param {string} data - Raw report data (TSV format)
 * @returns {object} - Parsed and analyzed data
 */
function parseListingsData(data) {
  const lines = data.split('\n');
  const headers = lines[0].split('\t');
  const listings = [];

  // Parse TSV data
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = lines[i].split('\t');
    const listing = {};

    headers.forEach((header, index) => {
      listing[header.trim()] = values[index] ? values[index].trim() : '';
    });

    listings.push(listing);
  }

  // Analyze the data
  const analysis = {
    totalListings: listings.length,
    categories: {},
    parentChildRelationships: [],
    byStatus: {},
    byFulfillment: {},
    listings: []
  };

  // Process each listing
  listings.forEach(listing => {
    const analyzed = analyzeSingleListing(listing);
    analysis.listings.push(analyzed);

    // Count by category
    const category = listing['product-id-type'] || 'Unknown';
    analysis.categories[category] = (analysis.categories[category] || 0) + 1;

    // Count by status
    const status = listing['status'] || 'Unknown';
    analysis.byStatus[status] = (analysis.byStatus[status] || 0) + 1;

    // Count by fulfillment
    const fulfillment = listing['fulfillment-channel'] || 'Unknown';
    analysis.byFulfillment[fulfillment] = (analysis.byFulfillment[fulfillment] || 0) + 1;

    // Track parent-child relationships
    if (listing['parent-child'] === 'Parent') {
      analysis.parentChildRelationships.push({
        type: 'parent',
        sku: listing['seller-sku'],
        asin: listing['asin1'],
        title: listing['item-name']
      });
    } else if (listing['parent-child'] === 'Child') {
      analysis.parentChildRelationships.push({
        type: 'child',
        sku: listing['seller-sku'],
        asin: listing['asin1'],
        title: listing['item-name'],
        parentSku: listing['parent-sku']
      });
    }
  });

  return analysis;
}

/**
 * Analyze a single listing and create human-readable description
 * @param {object} listing - Raw listing data
 * @returns {object} - Human-readable analysis
 */
function analyzeSingleListing(listing) {
  const sku = listing['seller-sku'] || 'Unknown SKU';
  const asin = listing['asin1'] || 'No ASIN';
  const title = listing['item-name'] || 'Untitled Product';
  const price = listing['price'] || 'No price set';
  const quantity = listing['quantity'] || '0';
  const status = listing['status'] || 'Unknown';
  const fulfillment = listing['fulfillment-channel'] || 'Unknown';
  const productType = listing['product-id-type'] || 'Unknown';
  const parentChild = listing['parent-child'] || 'Standalone';

  // Create plain English description
  let description = `**${title}**\n`;
  description += `SKU: ${sku} | ASIN: ${asin}\n`;

  // Status description
  if (status === 'Active') {
    description += `✅ Status: This listing is ACTIVE and available for sale\n`;
  } else if (status === 'Inactive') {
    description += `⚠️ Status: This listing is INACTIVE and NOT available for sale\n`;
  } else {
    description += `Status: ${status}\n`;
  }

  // Fulfillment description
  if (fulfillment === 'DEFAULT' || fulfillment === 'MERCHANT') {
    description += `📦 Fulfillment: You fulfill this (Seller Fulfilled/FBM)\n`;
  } else if (fulfillment === 'AMAZON_NA') {
    description += `📦 Fulfillment: Amazon fulfills this (FBA)\n`;
  } else {
    description += `📦 Fulfillment: ${fulfillment}\n`;
  }

  // Pricing and inventory
  description += `💰 Price: $${price}\n`;
  description += `📊 Inventory: ${quantity} units available\n`;

  // Parent-child relationships
  if (parentChild === 'Parent') {
    description += `👨‍👧 Type: This is a PARENT listing (has variations like size/color)\n`;
  } else if (parentChild === 'Child') {
    const parentSku = listing['parent-sku'] || 'Unknown';
    description += `👶 Type: This is a CHILD variation (parent SKU: ${parentSku})\n`;
  } else {
    description += `📦 Type: Standalone product (no variations)\n`;
  }

  // Category info
  description += `🏷️ Category: ${productType}\n`;

  return {
    sku,
    asin,
    title,
    price,
    quantity,
    status,
    fulfillment,
    parentChild,
    productType,
    description,
    rawData: listing
  };
}

/**
 * Analyze detailed listing information
 * @param {object} listing - Listing data from Listings API
 * @param {string} sku - The SKU
 * @returns {object} - Human-readable analysis
 */
function analyzeListingDetail(listing, sku) {
  const summaries = listing.summaries || [];
  const summary = summaries[0] || {};

  let description = `\n${'='.repeat(60)}\n`;
  description += `📦 DETAILED LISTING ANALYSIS: ${sku}\n`;
  description += `${'='.repeat(60)}\n\n`;

  // Basic info
  description += `**SKU:** ${sku}\n`;
  description += `**ASIN:** ${summary.asin || 'Not assigned'}\n`;
  description += `**Marketplace:** ${summary.marketplaceId || 'Unknown'}\n\n`;

  // Status
  if (summary.status && summary.status.length > 0) {
    description += `**Status:**\n`;
    summary.status.forEach(s => {
      description += `  - ${s}\n`;
    });
    description += `\n`;
  }

  // Product type
  if (summary.productType) {
    description += `**Product Type:** ${summary.productType}\n`;
    description += `  (This determines what attributes are required)\n\n`;
  }

  // Fulfillment channels
  if (summary.fulfillmentChannels && summary.fulfillmentChannels.length > 0) {
    description += `**Fulfillment Channels:**\n`;
    summary.fulfillmentChannels.forEach(channel => {
      if (channel === 'AMAZON_NA') {
        description += `  ✅ FBA (Fulfilled by Amazon)\n`;
      } else if (channel === 'DEFAULT') {
        description += `  ✅ FBM (Fulfilled by Merchant)\n`;
      } else {
        description += `  ✅ ${channel}\n`;
      }
    });
    description += `\n`;
  }

  // Issues
  if (listing.issues && listing.issues.length > 0) {
    description += `**⚠️ Issues Found:**\n`;
    listing.issues.forEach(issue => {
      description += `  - ${issue.code}: ${issue.message}\n`;
      if (issue.severity) {
        description += `    Severity: ${issue.severity}\n`;
      }
    });
    description += `\n`;
  } else {
    description += `**✅ No Issues Found**\n\n`;
  }

  // Offers
  if (listing.offers && listing.offers.length > 0) {
    description += `**Current Offers:**\n`;
    listing.offers.forEach(offer => {
      const price = offer.price?.value || 'Not set';
      const currency = offer.price?.currencyCode || 'USD';
      const fulfillment = offer.fulfillmentChannelCode || 'Unknown';

      description += `  - Price: ${currency} ${price}\n`;
      description += `    Fulfillment: ${fulfillment}\n`;
      if (offer.buyBoxEligible !== undefined) {
        description += `    Buy Box Eligible: ${offer.buyBoxEligible ? 'Yes ✅' : 'No ❌'}\n`;
      }
    });
    description += `\n`;
  }

  // Fulfillment availability
  if (listing.fulfillmentAvailability && listing.fulfillmentAvailability.length > 0) {
    description += `**Inventory:**\n`;
    listing.fulfillmentAvailability.forEach(fa => {
      const channel = fa.fulfillmentChannelCode || 'Unknown';
      const quantity = fa.quantity || 0;
      description += `  - ${channel}: ${quantity} units available\n`;
    });
    description += `\n`;
  }

  // Attributes (simplified)
  if (listing.attributes) {
    description += `**Product Attributes:**\n`;
    const attrs = listing.attributes;

    if (attrs.item_name) {
      description += `  - Title: ${attrs.item_name[0]?.value || 'Not set'}\n`;
    }
    if (attrs.brand) {
      description += `  - Brand: ${attrs.brand[0]?.value || 'Not set'}\n`;
    }
    if (attrs.manufacturer) {
      description += `  - Manufacturer: ${attrs.manufacturer[0]?.value || 'Not set'}\n`;
    }
    if (attrs.condition_type) {
      description += `  - Condition: ${attrs.condition_type[0]?.value || 'Not set'}\n`;
    }

    description += `\n`;
  }

  return {
    sku,
    success: true,
    description,
    rawData: listing
  };
}

/**
 * Generate a human-readable summary of the entire catalog
 * @param {object} analysis - Analysis from analyzeCatalog
 * @returns {string} - Plain English summary
 */
export function generateCatalogSummary(analysis) {
  let summary = `\n${'='.repeat(60)}\n`;
  summary += `📦 YOUR AMAZON CATALOG SUMMARY\n`;
  summary += `${'='.repeat(60)}\n\n`;

  summary += `**Total Listings:** ${analysis.totalListings}\n\n`;

  // Status breakdown
  summary += `**Status Breakdown:**\n`;
  Object.entries(analysis.byStatus).forEach(([status, count]) => {
    const emoji = status === 'Active' ? '✅' : status === 'Inactive' ? '⚠️' : '❓';
    summary += `  ${emoji} ${status}: ${count} listings\n`;
  });
  summary += `\n`;

  // Fulfillment breakdown
  summary += `**Fulfillment Method:**\n`;
  Object.entries(analysis.byFulfillment).forEach(([method, count]) => {
    const emoji = method.includes('AMAZON') ? '📦' : '🏪';
    const description = method.includes('AMAZON') ? 'FBA (Amazon fulfills)' : 'FBM (You fulfill)';
    summary += `  ${emoji} ${description}: ${count} listings\n`;
  });
  summary += `\n`;

  // Parent-child relationships
  const parents = analysis.parentChildRelationships.filter(r => r.type === 'parent');
  const children = analysis.parentChildRelationships.filter(r => r.type === 'child');

  if (parents.length > 0 || children.length > 0) {
    summary += `**Product Variations:**\n`;
    summary += `  👨‍👧 Parent Listings (with variations): ${parents.length}\n`;
    summary += `  👶 Child Variations: ${children.length}\n\n`;

    if (parents.length > 0) {
      summary += `  **Parent Products:**\n`;
      parents.forEach(parent => {
        const childCount = children.filter(c => c.parentSku === parent.sku).length;
        summary += `    - ${parent.title}\n`;
        summary += `      SKU: ${parent.sku} | ASIN: ${parent.asin}\n`;
        summary += `      Has ${childCount} variation(s)\n`;
      });
      summary += `\n`;
    }
  }

  // Categories
  summary += `**Product Categories:**\n`;
  Object.entries(analysis.categories).forEach(([category, count]) => {
    summary += `  🏷️ ${category}: ${count} listing(s)\n`;
  });
  summary += `\n`;

  summary += `${'='.repeat(60)}\n`;

  return summary;
}
