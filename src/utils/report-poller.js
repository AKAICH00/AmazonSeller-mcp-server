import { makeSpApiRequest } from './auth.js';

/**
 * Poll a report until it's done processing or fails
 * @param {string} reportId - The report ID to poll
 * @param {object} options - Polling options
 * @param {number} options.maxAttempts - Maximum number of polling attempts (default: 30)
 * @param {number} options.intervalMs - Milliseconds between polls (default: 5000)
 * @param {function} options.onProgress - Callback for progress updates
 * @returns {Promise<object>} - The completed report data
 */
export async function pollReportStatus(reportId, options = {}) {
  const {
    maxAttempts = 30,
    intervalMs = 5000,
    onProgress = null
  } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const report = await makeSpApiRequest(
        'GET',
        `/reports/2021-06-30/reports/${reportId}`
      );

      const status = report.processingStatus;

      if (onProgress) {
        onProgress({
          attempt,
          maxAttempts,
          status,
          reportId
        });
      }

      // Report is complete
      if (status === 'DONE') {
        return {
          success: true,
          report,
          attempts: attempt
        };
      }

      // Report failed
      if (status === 'FATAL' || status === 'CANCELLED') {
        return {
          success: false,
          report,
          error: `Report processing ${status.toLowerCase()}`,
          attempts: attempt
        };
      }

      // Still processing (IN_QUEUE or IN_PROGRESS)
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }

    } catch (error) {
      throw new Error(`Error polling report ${reportId}: ${error.message}`);
    }
  }

  // Timed out
  return {
    success: false,
    error: `Report polling timed out after ${maxAttempts} attempts`,
    attempts: maxAttempts
  };
}

/**
 * Download report document content
 * @param {string} reportDocumentId - The document ID
 * @returns {Promise<object>} - Document info and download URL
 */
export async function downloadReportDocument(reportDocumentId) {
  try {
    const document = await makeSpApiRequest(
      'GET',
      `/reports/2021-06-30/documents/${reportDocumentId}`
    );

    return {
      success: true,
      document,
      downloadUrl: document.url,
      compressionAlgorithm: document.compressionAlgorithm
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Complete workflow: Create report, poll until done, get document
 * @param {string} reportType - The type of report to generate
 * @param {object} options - Report options
 * @returns {Promise<object>} - Complete report result
 */
export async function generateAndDownloadReport(reportType, options = {}) {
  const {
    marketplaceIds = [process.env.SP_API_MARKETPLACE_ID],
    dataStartTime = null,
    dataEndTime = null,
    pollOptions = {}
  } = options;

  // Step 1: Create report
  console.log(`Creating ${reportType} report...`);
  const createResponse = await makeSpApiRequest(
    'POST',
    '/reports/2021-06-30/reports',
    {
      reportType,
      marketplaceIds,
      ...(dataStartTime && { dataStartTime }),
      ...(dataEndTime && { dataEndTime })
    }
  );

  const reportId = createResponse.reportId;
  console.log(`Report created: ${reportId}`);

  // Step 2: Poll until complete
  console.log('Polling for completion...');
  const pollResult = await pollReportStatus(reportId, {
    ...pollOptions,
    onProgress: (progress) => {
      console.log(`Attempt ${progress.attempt}/${progress.maxAttempts}: ${progress.status}`);
    }
  });

  if (!pollResult.success) {
    return {
      success: false,
      error: pollResult.error,
      reportId
    };
  }

  // Step 3: Download document
  const documentId = pollResult.report.reportDocumentId;
  console.log(`Downloading document: ${documentId}`);
  const downloadResult = await downloadReportDocument(documentId);

  return {
    success: true,
    reportId,
    documentId,
    downloadUrl: downloadResult.downloadUrl,
    report: pollResult.report,
    attempts: pollResult.attempts
  };
}

/**
 * Get list of available report types with descriptions
 * @returns {Array<object>} - Report types and their descriptions
 */
export function getAvailableReportTypes() {
  return [
    {
      type: 'GET_MERCHANT_LISTINGS_ALL_DATA',
      description: 'Inventory report with all listing data',
      category: 'Inventory'
    },
    {
      type: 'GET_FLAT_FILE_OPEN_LISTINGS_DATA',
      description: 'Active listings report',
      category: 'Inventory'
    },
    {
      type: 'GET_MERCHANT_LISTINGS_DATA',
      description: 'Active listings with pricing',
      category: 'Inventory'
    },
    {
      type: 'GET_MERCHANT_LISTINGS_INACTIVE_DATA',
      description: 'Inactive listings report',
      category: 'Inventory'
    },
    {
      type: 'GET_FBA_FULFILLMENT_INVENTORY_SUMMARY_DATA',
      description: 'FBA inventory summary',
      category: 'FBA'
    },
    {
      type: 'GET_FBA_FULFILLMENT_CURRENT_INVENTORY_DATA',
      description: 'Current FBA inventory levels',
      category: 'FBA'
    },
    {
      type: 'GET_FLAT_FILE_ALL_ORDERS_DATA_BY_ORDER_DATE',
      description: 'All orders by order date',
      category: 'Orders'
    },
    {
      type: 'GET_FLAT_FILE_ACTIONABLE_ORDER_DATA',
      description: 'Orders requiring action',
      category: 'Orders'
    },
    {
      type: 'GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE',
      description: 'Settlement report',
      category: 'Financial'
    },
    {
      type: 'GET_SELLER_FEEDBACK_DATA',
      description: 'Seller feedback report',
      category: 'Performance'
    }
  ];
}
