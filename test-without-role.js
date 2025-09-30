import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

console.log('🔍 Testing Amazon SP-API without AWS signature...\n');

async function getAccessToken() {
  try {
    const response = await axios.post('https://api.amazon.com/auth/o2/token', {
      grant_type: 'refresh_token',
      refresh_token: process.env.SP_API_REFRESH_TOKEN,
      client_id: process.env.SP_API_CLIENT_ID,
      client_secret: process.env.SP_API_CLIENT_SECRET
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Token error:', error.message);
    throw error;
  }
}

async function testSimpleRequest() {
  try {
    const token = await getAccessToken();
    console.log('✅ Got access token');

    // Try simple request with just the access token
    const response = await axios.get(
      'https://sellingpartnerapi-na.amazon.com/sellers/v1/marketplaceParticipations',
      {
        headers: {
          'x-amz-access-token': token,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ SUCCESS! Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Request failed:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);
  }
}

testSimpleRequest();
