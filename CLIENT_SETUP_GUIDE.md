# 🔌 Amazon SP-API MCP Server - Client Setup Guide

## 🔒 Security Overview

**Your MCP server is SECURE by design:**

- ✅ **stdio transport** - Only accessible locally via stdin/stdout
- ✅ **No network exposure** - MCP tools cannot be accessed over HTTP
- ✅ **Railway deployment** - Only exposes health endpoints (no MCP functionality)
- ✅ **Credentials in env** - Never exposed in API responses

**What's exposed on Railway:**
- `/health` - Basic health check (no sensitive data)
- `/auth-status` - Auth verification (only returns success/fail, no tokens)
- `/metrics` - Server metrics (uptime, memory)

**What's NOT exposed:**
- All 31 MCP tools (only accessible via local stdio)
- Amazon credentials
- Business data

---

## 📱 Setup for Different Clients

### 1. Claude Code (CLI) ✅ **ALREADY CONFIGURED**

**Location:** `/root/.mcp.json`

Your server is already added! Restart Claude Code to see the tools:

```bash
# Restart Claude Code session
exit
claude
```

**Verify it's working:**
```bash
# In Claude Code, ask:
"List available Amazon SP-API tools"
```

You should see all 31 tools available!

---

### 2. Claude Desktop (macOS/Windows)

**Config location:**
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

**Add this to your config:**

```json
{
  "mcpServers": {
    "amazon-sp-api": {
      "command": "node",
      "args": [
        "/root/projects/AMAZON-MCP/AmazonSeller-mcp-server/src/index.js"
      ],
      "env": {
        "SP_API_CLIENT_ID": "your_client_id_here",
        "SP_API_CLIENT_SECRET": "your_client_secret_here",
        "SP_API_REFRESH_TOKEN": "your_refresh_token_here",
        "SP_API_MARKETPLACE_ID": "ATVPDKIKX0DER",
        "SP_API_REGION": "us-east-1"
      }
    }
  }
}
```

**Restart Claude Desktop** to load the tools.

---

### 3. ChatGPT with MCP Connector

**Not recommended** - OpenAI doesn't natively support MCP. You would need:

1. **MCP-to-HTTP Bridge** (creates security risks)
2. **Custom GPT with API** (requires exposing tools over HTTP)

**Alternative:** Use Claude Code or Claude Desktop instead - they have native MCP support.

---

### 4. Other MCP Clients

Any MCP-compatible client can connect using **stdio transport**:

```json
{
  "command": "node",
  "args": ["/path/to/AmazonSeller-mcp-server/src/index.js"],
  "env": {
    "SP_API_CLIENT_ID": "your_client_id",
    "SP_API_CLIENT_SECRET": "your_client_secret",
    "SP_API_REFRESH_TOKEN": "your_refresh_token",
    "SP_API_MARKETPLACE_ID": "ATVPDKIKX0DER",
    "SP_API_REGION": "us-east-1"
  }
}
```

---

## 🧪 Testing Your Connection

### Test from Claude Code

```bash
# Start Claude Code
claude

# Ask Claude to test the connection
"Use the amazon_get_seller_info tool to fetch my seller account details"
```

**Expected result:**
```json
{
  "sellerId": "A2CUU3BH8VJ79Q",
  "name": "Bottles4You",
  "marketplaces": [
    "ATVPDKIKX0DER",
    "A2EUQ1WTGCTBG2",
    ...
  ]
}
```

### Test Tools Directly

```bash
cd /root/projects/AMAZON-MCP/AmazonSeller-mcp-server

# Run test suite
node test-all-tools.js

# Expected: 8/8 tests passing
```

### Test Catalog Analyzer

```bash
# Analyze your full catalog
node analyze-catalog.js

# Check specific product
node analyze-catalog.js sku YOUR_SKU_HERE
```

---

## 🌐 Railway Deployment (Health Monitoring Only)

**Your Railway URL:** [Provided by Railway]

**What Railway does:**
- ✅ Keeps health check endpoints alive 24/7
- ✅ Monitors server health
- ✅ Auto-restarts on crashes
- ❌ Does NOT expose MCP tools (by design)

**Testing Railway endpoints:**

```bash
# Health check (public, safe)
curl https://your-railway-url/health

# Auth status (public, but only shows success/fail)
curl https://your-railway-url/auth-status

# Metrics (public, only server stats)
curl https://your-railway-url/metrics
```

**Railway is NOT used for MCP connections** - it's only for monitoring!

---

## 🔐 Security Best Practices

### ✅ DO:
- Keep credentials in environment variables
- Use Railway for health monitoring
- Connect via stdio (local only)
- Rotate refresh tokens periodically
- Monitor Railway logs for auth issues

### ❌ DON'T:
- Expose MCP tools over HTTP
- Share your `.mcp.json` file publicly
- Commit credentials to git
- Use Railway URL for MCP connections
- Create HTTP bridges unless absolutely necessary

---

## 🛠️ Troubleshooting

### "No tools available"

**Check:**
1. MCP server is in your `.mcp.json`
2. Path to `index.js` is correct
3. Environment variables are set
4. Node.js is installed

**Fix:**
```bash
# Test manually
cd /root/projects/AMAZON-MCP/AmazonSeller-mcp-server
node src/index.js

# Should start without errors
```

### "Authentication failed"

**Check:**
1. Refresh token is valid
2. No extra spaces in env variables
3. Test locally first:

```bash
node test-auth.js
```

### "Command not found: node"

**Fix:**
```bash
# Install Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

---

## 📊 Available Tools (31 Total)

### Catalog & Inventory (8 tools)
- `amazon_search_catalog` - Search Amazon catalog
- `amazon_get_catalog_item` - Get product details
- `amazon_get_inventory_summaries` - Check FBA inventory
- `amazon_get_inventory_quantity` - Check FBM inventory
- `amazon_list_inventory_supply_sources` - Supply sources
- `amazon_create_fba_inbound_shipment` - Create shipment
- `amazon_get_fba_shipment_items` - Shipment details
- `amazon_list_fba_shipments` - List shipments

### Orders (4 tools)
- `amazon_get_orders` - List orders
- `amazon_get_order` - Order details
- `amazon_get_order_items` - Order items
- `amazon_get_order_address` - Shipping address

### Reports (5 tools)
- `amazon_create_report` - Generate reports
- `amazon_get_report` - Get report status
- `amazon_get_report_document` - Download report
- `amazon_get_report_types` - List available types
- `amazon_cancel_report` - Cancel report

### Listings & Pricing (6 tools)
- `amazon_get_listing` - Get listing details
- `amazon_put_listing` - Update listing
- `amazon_delete_listing` - Delete listing
- `amazon_get_competitive_pricing` - Get pricing data
- `amazon_get_item_offers` - Get offers
- `amazon_get_listing_offers` - Get listing offers

### Finance & Feeds (5 tools)
- `amazon_list_financial_events` - Financial data
- `amazon_create_feed` - Submit feed
- `amazon_get_feed` - Feed status
- `amazon_get_feed_document` - Download feed result
- `amazon_cancel_feed` - Cancel feed

### Seller Info (3 tools)
- `amazon_get_seller_info` - Account details
- `amazon_get_marketplace_participations` - Marketplaces
- `amazon_get_auth_status` - Auth verification

---

## 🎯 Next Steps

1. ✅ **Claude Code is already configured** - Just restart your session
2. 📱 **Add to Claude Desktop** if needed (see config above)
3. 🧪 **Test the connection** with `amazon_get_seller_info`
4. 📊 **Try catalog analyzer** with `node analyze-catalog.js`
5. 🎉 **Start building!** All 31 tools ready to use

---

**Questions?** Check the main README.md or test results in TEST_RESULTS.md

**Railway monitoring:** Your deployment is live at your Railway URL for health checks only!
