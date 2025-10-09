# Amazon SP-API MCP Server - Claude Desktop Quick Reference

## 🚀 Getting Started

After restarting Claude Desktop, you have access to 31 Amazon SP-API tools for your **Bottles4You** seller account across 9 marketplaces.

---

## 📊 Common Use Cases

### 1. Check Inventory

**What to ask:**
- "Show me my current FBA inventory"
- "What products do I have in stock?"
- "Check inventory levels for all my products"

**Tool used:** `getInventorySummaries` or `getFBAInventorySummaries`

**Example:**
```
You: "Check my inventory in the US marketplace"
Claude: [Calls getInventorySummaries with marketplace ATVPDKIKX0DER]
```

---

### 2. View Recent Orders

**What to ask:**
- "Show me orders from the last 7 days"
- "Get my recent orders"
- "What orders came in today?"

**Tool used:** `getOrders`

**Example:**
```
You: "Show me all orders from the past week"
Claude: [Calls getOrders with createdAfter date]
```

---

### 3. Product Lookup

**What to ask:**
- "Get details for ASIN B09PGPFVBH"
- "Show me product information for [ASIN]"
- "Search for products with keyword 'juice bottle'"

**Tools used:** `getCatalogItem`, `searchCatalogItems`

**Example:**
```
You: "Look up ASIN B09PGPFVBH"
Claude: [Calls getCatalogItem with the ASIN]
```

---

### 4. Marketplace Information

**What to ask:**
- "What marketplaces am I active in?"
- "Show me my seller account details"
- "List all my Amazon marketplaces"

**Tool used:** `getMarketplaceParticipations`

**Example:**
```
You: "What marketplaces do I sell in?"
Claude: [Returns US, Canada, Mexico, Brazil + Amazon services]
```

---

### 5. Update Inventory Quantity

**What to ask:**
- "Update inventory for SKU [sku] to 100 units"
- "Set stock level for [SKU] to 50"

**Tool used:** `updateInventory`

**Example:**
```
You: "Set quantity to 100 for SKU BT015-013-01-01-01-0098PK"
Claude: [Calls updateInventory with SKU and quantity]
```

---

### 6. Generate Reports

**What to ask:**
- "Create an inventory report"
- "Generate a sales report for last month"
- "Get a settlement report"

**Tools used:** `createReport`, `getReport`, `getReportDocument`

**Example:**
```
You: "Create an inventory health report"
Claude: [Calls createReport with reportType]
```

---

### 7. Check Pricing

**What to ask:**
- "Get pricing for ASIN B09PGPFVBH"
- "Show me competitive pricing for [ASIN]"
- "What's the current price for [SKU]?"

**Tools used:** `getPricing`, `getCompetitivePricing`

**Example:**
```
You: "Check competitive pricing for ASIN B09PGPFVBH"
Claude: [Calls getCompetitivePricing]
```

---

### 8. Manage Listings

**What to ask:**
- "Get listing details for SKU [sku]"
- "Update listing for [SKU]"

**Tools used:** `getListingsItem`, `putListingsItem`

**Example:**
```
You: "Show me listing details for SKU BT042-035-09-01-01-0050PK"
Claude: [Calls getListingsItem]
```

---

### 9. View Financial Data

**What to ask:**
- "Show me recent financial transactions"
- "Get financial events from last week"

**Tool used:** `listFinancialEvents`

**Example:**
```
You: "Show financial events from the past month"
Claude: [Calls listFinancialEvents with date range]
```

---

## 🎯 Your Active Marketplaces

| Marketplace | ID | Currency | Store Name |
|------------|-----|----------|------------|
| Amazon.com (US) | ATVPDKIKX0DER | USD | Bottles4You |
| Amazon.ca (Canada) | A2EUQ1WTGCTBG2 | CAD | Bottles4You |
| Amazon.com.mx (Mexico) | A1AM78C64UM0Y8 | MXN | Bottles4You |
| Amazon.com.br (Brazil) | A2Q3Y263D00KWC | BRL | Bottles4You |
| + 5 other Amazon services | Various | Various | Bottles4You |

**Default Marketplace:** US (ATVPDKIKX0DER)

---

## 📦 Your Product Categories

Based on your inventory, you sell:

- **Juice Bottles** (14.5 oz square, 16 oz cylinder)
  - Pack sizes: 12, 16, 25, 50, 100

- **Energy Shot Bottles** (2 oz Boston Round)
  - Pack sizes: 98, 216, 324, 648

- **Spray Bottles** (32 oz, 64 oz)
  - Pack sizes: 12, 15, 30

- **Specialty Bottles**
  - 4 oz Boston Round with Mist Sprayer

---

## 🔧 All Available Tools (31 Total)

### Authentication
- `checkCredentials` - Verify API credentials

### Catalog & Inventory (8)
- `getCatalogItem` - Get product details by ASIN
- `searchCatalogItems` - Search products by keywords
- `getInventorySummaries` - Get seller inventory
- `getFBAInventorySummaries` - Get FBA inventory
- `updateInventory` - Update quantity/availability
- `getInboundEligibility` - Check FBA eligibility

### Orders (4)
- `getOrders` - List orders with filters
- `getOrder` - Get specific order details
- `getOrderItems` - Get items in an order

### Reports (5)
- `createReport` - Generate new report
- `getReport` - Check report status
- `getReports` - List available reports
- `getReportDocument` - Download report data

### Feeds (3)
- `createFeed` - Submit feed
- `getFeed` - Check feed status
- `getFeedDocument` - Get feed results

### Finance (3)
- `listFinancialEventGroups` - Get event groups
- `listFinancialEvents` - Get transactions
- `getFinancialEventGroup` - Get group details

### Notifications (3)
- `getSubscription` - Get notification config
- `createSubscription` - Set up notifications
- `getDestinations` - List notification endpoints

### Product Pricing (3)
- `getPricing` - Get product pricing
- `getCompetitivePricing` - Get competitor prices
- `getListingOffers` - Get listing offers

### Listings (3)
- `getListingsItem` - Get listing details
- `putListingsItem` - Create/update listing
- `deleteListingsItem` - Remove listing

### Seller Info (2)
- `getMarketplaceParticipations` - Get marketplaces
- `getShipments` - Get FBA shipments

---

## 💡 Pro Tips

### Natural Language Works Best
Instead of technical queries, just ask naturally:
- ✅ "What products am I selling?"
- ✅ "Show me today's orders"
- ✅ "Check if I have any low stock items"

### Be Specific with Dates
- "Orders from last week"
- "Inventory as of today"
- "Financial events from January 2025"

### Use ASINs and SKUs
- "Get details for ASIN B09PGPFVBH"
- "Update SKU BT042-035-09-01-01-0050PK"

### Ask for Summaries
- "Summarize my top-selling products"
- "Give me an overview of my inventory levels"
- "What's my best marketplace?"

---

## 🚨 Important Notes

### Credentials
Your Amazon SP-API credentials are stored in:
```
\\wsl.localhost\Ubuntu-22.04\root\projects\AMAZON-MCP\AmazonSeller-mcp-server\.env
```

**Never share these credentials!**

### Rate Limits
Amazon SP-API has rate limits. If you get errors about rate limiting, wait a few seconds between requests.

### Permissions
Make sure your SP-API app has the necessary permissions for the operations you're trying to perform.

### Marketplace IDs
When Claude asks for a marketplace, you can specify:
- "US marketplace" → ATVPDKIKX0DER
- "Canadian marketplace" → A2EUQ1WTGCTBG2
- "Mexico marketplace" → A1AM78C64UM0Y8
- Or just say "default" for US

---

## 🔄 Troubleshooting

### "Server not responding"
1. Restart Claude Desktop
2. Check that the `.env` file exists and has valid credentials
3. Verify Node.js is installed in WSL

### "Authentication failed"
1. Check your SP-API credentials in `.env`
2. Verify the refresh token hasn't expired
3. Make sure all required credentials are set

### "Command not found"
1. The server runs from WSL, make sure the path is correct
2. Run `npm install` in the project directory if needed

---

## 📝 Quick Examples

### Example Conversation 1: Inventory Check
```
You: "Check my FBA inventory levels"

Claude: [Calls getFBAInventorySummaries]

Claude: "You have 33 products listed. Currently all showing 0
        stock. Would you like me to check specific SKUs or
        create a replenishment report?"
```

### Example Conversation 2: Order Analysis
```
You: "Show me orders from the last 30 days"

Claude: [Calls getOrders with date filter]

Claude: "I found 47 orders in the past 30 days. The most
        popular product was the 50-pack 14.5oz bottles.
        Would you like details on specific orders?"
```

### Example Conversation 3: Product Search
```
You: "Search for all 2oz bottle products"

Claude: [Calls searchCatalogItems with keyword "2oz bottle"]

Claude: "I found 5 products:
        - 2oz bottles (98 pack)
        - 2oz bottles (216 pack)
        - 2oz bottles (324 pack)
        Would you like pricing or inventory details?"
```

---

## 🎉 Success!

You're now ready to use Amazon SP-API tools directly in Claude Desktop!

Just ask naturally and Claude will handle the technical details of calling the right tools with the right parameters.

**Happy selling! 🛍️**

---

*Generated by Claude Code for Bottles4You Amazon Seller Account*
*Last Updated: 2025-10-09*
