import dotenv from 'dotenv';
import { makeSpApiRequest } from './src/utils/auth.js';

dotenv.config();

console.log('🔍 Testing Amazon SP-API Catalog Search...\n');

async function testCatalogSearch() {
  try {
    console.log('Searching for "laptop" in catalog...');

    const data = await makeSpApiRequest(
      'GET',
      '/catalog/2022-04-01/items',
      null,
      {
        keywords: 'laptop',
        marketplaceIds: process.env.SP_API_MARKETPLACE_ID,
        pageSize: 5
      }
    );

    console.log('✅ SUCCESS! Catalog search working!');
    console.log(`Found ${data.items?.length || 0} items\n`);

    if (data.items && data.items.length > 0) {
      console.log('First result:');
      const item = data.items[0];
      console.log('- ASIN:', item.asin);
      console.log('- Title:', item.summaries?.[0]?.itemName || 'N/A');
      console.log('- Brand:', item.attributes?.brand?.[0]?.value || 'N/A');
    }

    return true;
  } catch (error) {
    console.error('❌ FAILED! Catalog search error:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

testCatalogSearch();
