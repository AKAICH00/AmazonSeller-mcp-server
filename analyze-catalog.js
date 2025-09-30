import dotenv from 'dotenv';
import { analyzeCatalog, generateCatalogSummary, getListingDetails } from './src/utils/catalog-analyzer.js';
import fs from 'fs';

dotenv.config();

console.log('🔍 Amazon Catalog Analyzer - Plain English Edition\n');
console.log('='.repeat(60));

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'analyze';

  if (command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }

  if (command === 'analyze' || command === 'all') {
    console.log('\n📦 Analyzing your entire catalog...\n');

    const includeInactive = args.includes('--include-inactive');
    const result = await analyzeCatalog({ includeInactive });

    if (!result.success) {
      console.error('❌ Error:', result.error);
      return;
    }

    // Generate and display summary
    const summary = generateCatalogSummary(result.analysis);
    console.log(summary);

    // Show first 5 listings in detail
    console.log('\n📋 Sample Listings (first 5):');
    console.log('='.repeat(60));

    result.analysis.listings.slice(0, 5).forEach((listing, index) => {
      console.log(`\n${index + 1}. ${listing.description}`);
    });

    // Save full report to file
    const reportPath = './catalog-analysis-report.txt';
    let fullReport = summary;
    fullReport += '\n\n' + '='.repeat(60);
    fullReport += '\n📋 COMPLETE LISTING DETAILS\n';
    fullReport += '='.repeat(60) + '\n';

    result.analysis.listings.forEach((listing, index) => {
      fullReport += `\n${index + 1}. ${listing.description}\n`;
      fullReport += '-'.repeat(60) + '\n';
    });

    fs.writeFileSync(reportPath, fullReport);
    console.log(`\n💾 Full report saved to: ${reportPath}`);
    console.log(`   Total listings analyzed: ${result.analysis.totalListings}`);

  } else if (command === 'sku') {
    const sku = args[1];
    if (!sku) {
      console.error('❌ Error: Please provide a SKU');
      console.log('Usage: node analyze-catalog.js sku YOUR-SKU-HERE');
      return;
    }

    console.log(`\n🔍 Getting detailed information for SKU: ${sku}\n`);

    const results = await getListingDetails(sku);

    results.forEach(result => {
      if (result.success) {
        console.log(result.description);
      } else {
        console.error(`❌ Error for SKU ${result.sku}:`, result.error);
      }
    });

  } else if (command === 'parents') {
    console.log('\n👨‍👧 Analyzing parent-child relationships...\n');

    const result = await analyzeCatalog({ includeInactive: false });

    if (!result.success) {
      console.error('❌ Error:', result.error);
      return;
    }

    const parents = result.analysis.parentChildRelationships.filter(r => r.type === 'parent');
    const children = result.analysis.parentChildRelationships.filter(r => r.type === 'child');

    console.log(`Found ${parents.length} parent products with ${children.length} total variations\n`);
    console.log('='.repeat(60));

    if (parents.length === 0) {
      console.log('\n📦 You have no variation products (parent-child relationships)');
      console.log('   All your listings are standalone products.');
    } else {
      parents.forEach(parent => {
        const parentChildren = children.filter(c => c.parentSku === parent.sku);

        console.log(`\n👨‍👧 PARENT: ${parent.title}`);
        console.log(`   SKU: ${parent.sku}`);
        console.log(`   ASIN: ${parent.asin}`);
        console.log(`   Variations: ${parentChildren.length}`);

        if (parentChildren.length > 0) {
          console.log(`\n   Child Variations:`);
          parentChildren.forEach((child, index) => {
            console.log(`   ${index + 1}. ${child.title}`);
            console.log(`      SKU: ${child.sku} | ASIN: ${child.asin}`);
          });
        }
        console.log('\n' + '-'.repeat(60));
      });
    }

  } else if (command === 'active') {
    console.log('\n✅ Listing only ACTIVE products...\n');

    const result = await analyzeCatalog({ includeInactive: false });

    if (!result.success) {
      console.error('❌ Error:', result.error);
      return;
    }

    const activeListings = result.analysis.listings.filter(l => l.status === 'Active');

    console.log(`Found ${activeListings.length} active listings\n`);
    console.log('='.repeat(60));

    activeListings.forEach((listing, index) => {
      console.log(`\n${index + 1}. ${listing.description}`);
    });

  } else if (command === 'inactive') {
    console.log('\n⚠️ Listing only INACTIVE products...\n');

    const result = await analyzeCatalog({ includeInactive: true });

    if (!result.success) {
      console.error('❌ Error:', result.error);
      return;
    }

    const inactiveListings = result.analysis.listings.filter(l => l.status === 'Inactive');

    console.log(`Found ${inactiveListings.length} inactive listings\n`);
    console.log('='.repeat(60));

    if (inactiveListings.length === 0) {
      console.log('\n✅ Great! You have no inactive listings.');
    } else {
      inactiveListings.forEach((listing, index) => {
        console.log(`\n${index + 1}. ${listing.description}`);
      });
    }

  } else {
    console.error(`❌ Unknown command: ${command}`);
    showHelp();
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ Analysis complete!\n');
}

function showHelp() {
  console.log(`
📖 Amazon Catalog Analyzer - Help

USAGE:
  node analyze-catalog.js [command] [options]

COMMANDS:
  analyze, all         Analyze your entire catalog (default)
                      Options: --include-inactive

  sku [SKU]           Get detailed info for a specific SKU
                      Example: node analyze-catalog.js sku MY-SKU-123

  parents             Show only parent products and their variations
                      (products with size/color variations)

  active              Show only ACTIVE listings

  inactive            Show only INACTIVE listings

  help, --help, -h    Show this help message

EXAMPLES:
  # Analyze all active listings
  node analyze-catalog.js

  # Include inactive listings too
  node analyze-catalog.js analyze --include-inactive

  # Get details for specific SKU
  node analyze-catalog.js sku BOTTLE-RED-12OZ

  # See parent-child relationships
  node analyze-catalog.js parents

  # See only inactive products
  node analyze-catalog.js inactive

OUTPUT:
  - Plain English descriptions of each listing
  - Status (Active/Inactive)
  - Fulfillment method (FBA vs FBM)
  - Pricing and inventory
  - Parent-child relationships
  - Categories
  - Full report saved to catalog-analysis-report.txt

`);
}

main().catch(error => {
  console.error('❌ Fatal error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
