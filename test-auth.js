import dotenv from 'dotenv';
import { getAccessToken } from './src/utils/auth.js';

// Load environment variables
dotenv.config();

console.log('🔐 Testing Amazon SP-API Authentication...\n');

console.log('Credentials loaded:');
console.log('- Client ID:', process.env.SP_API_CLIENT_ID ? '✅ Set' : '❌ Missing');
console.log('- Client Secret:', process.env.SP_API_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
console.log('- Refresh Token:', process.env.SP_API_REFRESH_TOKEN ? '✅ Set' : '❌ Missing');
console.log('- AWS Access Key:', process.env.SP_API_AWS_ACCESS_KEY ? '✅ Set' : '❌ Missing');
console.log('- AWS Secret Key:', process.env.SP_API_AWS_SECRET_KEY ? '✅ Set' : '❌ Missing');
console.log('- Role ARN:', process.env.SP_API_ROLE_ARN ? '✅ Set' : '❌ Missing');
console.log('- Marketplace:', process.env.SP_API_MARKETPLACE_ID);
console.log('- Region:', process.env.SP_API_REGION);
console.log();

try {
  console.log('Attempting to get access token...');
  const token = await getAccessToken();
  console.log('✅ SUCCESS! Authentication working!');
  console.log('Token preview:', token.substring(0, 20) + '...');
  process.exit(0);
} catch (error) {
  console.error('❌ FAILED! Authentication error:');
  console.error(error.message);
  if (error.response?.data) {
    console.error('API Response:', JSON.stringify(error.response.data, null, 2));
  }
  process.exit(1);
}
