import dotenv from 'dotenv';
import { makeSpApiRequest } from './src/utils/auth.js';

dotenv.config();

console.log('👤 Testing Amazon SP-API Seller Info...\n');

async function testSellerInfo() {
  try {
    console.log('Getting marketplace participations...');

    const data = await makeSpApiRequest(
      'GET',
      '/sellers/v1/marketplaceParticipations',
      null,
      {}
    );

    console.log('✅ SUCCESS! Seller API working!');
    console.log('Response:', JSON.stringify(data, null, 2));

    return true;
  } catch (error) {
    console.error('❌ FAILED! Seller info error:');
    console.error('Error:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

testSellerInfo();
