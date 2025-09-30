import dotenv from 'dotenv';
import { generateAndDownloadReport, getAvailableReportTypes } from './src/utils/report-poller.js';

dotenv.config();

console.log('🧪 Amazon SP-API - Report Workflow Test\n');
console.log('='.repeat(60));

async function main() {
  console.log('\n📋 Available Report Types:');
  console.log('-'.repeat(60));

  const reportTypes = getAvailableReportTypes();
  reportTypes.forEach((report, index) => {
    console.log(`${index + 1}. [${report.category}] ${report.type}`);
    console.log(`   ${report.description}`);
  });

  console.log('\n🚀 Testing Report Workflow');
  console.log('-'.repeat(60));

  // Test with a simple inventory report
  const reportType = 'GET_MERCHANT_LISTINGS_ALL_DATA';
  console.log(`\nGenerating report: ${reportType}`);

  try {
    const result = await generateAndDownloadReport(reportType, {
      pollOptions: {
        maxAttempts: 10,  // 10 attempts = ~50 seconds max
        intervalMs: 5000  // Check every 5 seconds
      }
    });

    if (result.success) {
      console.log('\n✅ SUCCESS! Report generated and ready');
      console.log(`Report ID: ${result.reportId}`);
      console.log(`Document ID: ${result.documentId}`);
      console.log(`Download URL: ${result.downloadUrl}`);
      console.log(`Completed in ${result.attempts} polling attempts`);
    } else {
      console.log('\n❌ FAILED');
      console.log(`Error: ${result.error}`);
      console.log(`Report ID: ${result.reportId}`);
    }

  } catch (error) {
    console.log('\n❌ ERROR');
    console.log(`Error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ Test complete!\n');
}

main().catch(console.error);
