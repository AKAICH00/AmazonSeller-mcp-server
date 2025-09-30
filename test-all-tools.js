import dotenv from 'dotenv';
import { makeSpApiRequest } from './src/utils/auth.js';

dotenv.config();

console.log('🧪 Amazon SP-API MCP Server - Comprehensive Tool Testing\n');
console.log('='.repeat(60));

const tests = [];
let passed = 0;
let failed = 0;

async function runTest(name, testFn) {
  process.stdout.write(`\n📋 ${name}... `);
  try {
    const result = await testFn();
    console.log('✅ PASSED');
    passed++;
    tests.push({ name, status: 'PASSED', result });
    return result;
  } catch (error) {
    console.log('❌ FAILED');
    console.log(`   Error: ${error.message}`);
    failed++;
    tests.push({ name, status: 'FAILED', error: error.message });
    return null;
  }
}

async function main() {
  console.log('\n📦 CATALOG TOOLS');
  console.log('-'.repeat(60));

  await runTest('Search Catalog Items', async () => {
    const data = await makeSpApiRequest('GET', '/catalog/2022-04-01/items', null, {
      keywords: 'bottle',
      marketplaceIds: process.env.SP_API_MARKETPLACE_ID,
      pageSize: 3
    });
    return `Found ${data.items?.length || 0} items`;
  });

  const testAsin = 'B0DZD9S5GC'; // MacBook from previous test
  await runTest('Get Catalog Item by ASIN', async () => {
    const data = await makeSpApiRequest('GET', `/catalog/2022-04-01/items/${testAsin}`, null, {
      marketplaceIds: process.env.SP_API_MARKETPLACE_ID
    });
    return `ASIN: ${data.asin}`;
  });

  console.log('\n📊 SELLER TOOLS');
  console.log('-'.repeat(60));

  await runTest('Get Marketplace Participations', async () => {
    const data = await makeSpApiRequest('GET', '/sellers/v1/marketplaceParticipations');
    return `Participating in ${data.payload?.length || 0} marketplaces`;
  });

  console.log('\n📦 INVENTORY TOOLS');
  console.log('-'.repeat(60));

  await runTest('Get Inventory Summaries', async () => {
    const data = await makeSpApiRequest('GET', '/fba/inventory/v1/summaries', null, {
      details: false,
      granularityType: 'Marketplace',
      granularityId: process.env.SP_API_MARKETPLACE_ID,
      marketplaceIds: process.env.SP_API_MARKETPLACE_ID
    });
    return `Retrieved inventory summaries`;
  });

  console.log('\n📝 ORDERS TOOLS');
  console.log('-'.repeat(60));

  await runTest('List Orders', async () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const data = await makeSpApiRequest('GET', '/orders/v0/orders', null, {
      MarketplaceIds: process.env.SP_API_MARKETPLACE_ID,
      CreatedAfter: thirtyDaysAgo.toISOString(),
      MaxResultsPerPage: 5
    });
    return `Found ${data.payload?.Orders?.length || 0} orders`;
  });

  console.log('\n💰 PRICING TOOLS');
  console.log('-'.repeat(60));

  await runTest('Get Competitive Pricing', async () => {
    const data = await makeSpApiRequest('GET', '/products/pricing/v0/competitivePrice', null, {
      MarketplaceId: process.env.SP_API_MARKETPLACE_ID,
      Asins: testAsin,
      ItemType: 'Asin'
    });
    return `Retrieved pricing for ${testAsin}`;
  });

  console.log('\n📈 REPORTS TOOLS');
  console.log('-'.repeat(60));

  await runTest('Get Report Types', async () => {
    // This tests if we can access the reports endpoint with proper parameters
    const data = await makeSpApiRequest('GET', '/reports/2021-06-30/reports', null, {
      reportTypes: 'GET_MERCHANT_LISTINGS_ALL_DATA',
      pageSize: 5
    });
    return `Retrieved reports: ${data.reports?.length || 0} found`;
  });

  console.log('\n🚚 FBA TOOLS');
  console.log('-'.repeat(60));

  await runTest('Get FBA Inventory Summaries', async () => {
    const data = await makeSpApiRequest('GET', '/fba/inventory/v1/summaries', null, {
      details: false,
      granularityType: 'Marketplace',
      granularityId: process.env.SP_API_MARKETPLACE_ID,
      marketplaceIds: process.env.SP_API_MARKETPLACE_ID
    });
    return `Retrieved FBA inventory summaries`;
  });

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${tests.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);

  console.log('\n📋 DETAILED RESULTS:');
  tests.forEach(test => {
    const icon = test.status === 'PASSED' ? '✅' : '❌';
    console.log(`${icon} ${test.name}`);
    if (test.result) {
      console.log(`   → ${test.result}`);
    }
    if (test.error) {
      console.log(`   → ${test.error}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('\n✨ Testing complete!\n');
}

main().catch(console.error);
