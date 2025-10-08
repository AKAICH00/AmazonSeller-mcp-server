# 🤖 ChatGPT Custom GPT Setup Guide

## Complete Guide to Add Your Amazon SP-API MCP Server to ChatGPT

Your MCP server now supports **Streamable HTTP transport** (the latest MCP standard), making it compatible with ChatGPT Custom GPTs!

---

## 📋 Prerequisites

✅ **ChatGPT Plus subscription** (required for Custom GPTs)
✅ **Railway deployment** (free tier works!)
✅ **API Key** (already generated and in your .env file)

---

## 🚀 Step 1: Deploy to Railway

### Option A: Using the Deploy Script

```bash
cd /root/projects/AMAZON-MCP/AmazonSeller-mcp-server

# Set your Railway API key in environment
# Make sure CHATGPT_API_KEY is in your .env file
./deploy-railway.sh
```

### Option B: Manual Railway Deployment

1. **Login to Railway**:
   ```bash
   railway login
   ```

2. **Link to project** (or create new):
   ```bash
   railway link
   # OR
   railway init
   ```

3. **Set environment variables**:
   ```bash
   # Amazon SP-API credentials
   railway variables set SP_API_CLIENT_ID="your_client_id"
   railway variables set SP_API_CLIENT_SECRET="your_client_secret"
   railway variables set SP_API_REFRESH_TOKEN="your_refresh_token"
   railway variables set SP_API_MARKETPLACE_ID="ATVPDKIKX0DER"
   railway variables set SP_API_REGION="us-east-1"

   # ChatGPT API key (from your .env file)
   railway variables set CHATGPT_API_KEY="YOUR_GENERATED_API_KEY_HERE"
   ```

4. **Deploy**:
   ```bash
   railway up
   ```

5. **Get your public URL**:
   ```bash
   railway domain
   ```

   Save this URL - you'll need it for ChatGPT setup!

---

## 🔧 Step 2: Test Your Deployment

Before adding to ChatGPT, verify everything works:

```bash
# Test health endpoint (public, no auth)
curl https://your-railway-url.railway.app/health

# Test OpenAPI spec (public, no auth)
curl https://your-railway-url.railway.app/openapi.json

# Test MCP endpoint (requires API key)
curl -X POST https://your-railway-url.railway.app/mcp/messages \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_GENERATED_API_KEY_HERE" \
  -d '{"method":"tools/list"}'
```

Expected responses:
- `/health` → `{"status":"ok",...}`
- `/openapi.json` → Full OpenAPI specification
- `/mcp/messages` → List of 31 available tools

---

## 🤖 Step 3: Create Custom GPT

### 3.1 Go to ChatGPT Custom GPT Builder

1. Open ChatGPT (https://chat.openai.com)
2. Click your profile → **"My GPTs"**
3. Click **"Create a GPT"**

### 3.2 Configure Basic Info

In the **Configure** tab:

- **Name**: `Amazon Seller Assistant`
- **Description**: `Helps manage your Amazon seller account using the SP-API. Can check inventory, orders, catalog, reports, and more.`
- **Instructions**:
  ```
  You are an expert Amazon seller assistant with access to real-time Amazon SP-API data through MCP tools.

  You can help with:
  - Checking inventory levels (FBA and FBM)
  - Managing catalog and product listings
  - Viewing and analyzing orders
  - Generating and retrieving reports
  - Monitoring pricing and competition
  - Managing FBA shipments
  - Accessing financial data
  - And much more!

  Always use the MCP tools to fetch real data from Amazon SP-API. Never make up or estimate data.
  When users ask about their Amazon business, use the appropriate tools to get accurate information.
  ```

- **Conversation starters** (optional):
  ```
  - Show me my current inventory levels
  - What orders came in today?
  - Check my catalog for out-of-stock items
  - Generate my sales report for last month
  ```

### 3.3 Add Actions (MCP Connection)

1. Scroll down to **"Actions"** section
2. Click **"Create new action"**
3. **Import from URL**: `https://your-railway-url.railway.app/openapi.json`

   *(Replace `your-railway-url` with your actual Railway domain)*

4. The schema should auto-populate. Verify you see:
   - Endpoint: `/mcp/messages` (POST)
   - Endpoint: `/health` (GET)

5. **Authentication**:
   - Click **"Authentication"** dropdown
   - Select **"API Key"**
   - **API Key**: `YOUR_GENERATED_API_KEY_HERE`
   - **Auth Type**: `Custom`
   - **Custom Header Name**: `X-API-Key`

6. Click **"Save"**

### 3.4 Test the Connection

In the GPT preview (right side):

```
Ask: "List all available Amazon tools"
```

The GPT should use the `/mcp/messages` endpoint and return a list of 31 tools!

### 3.5 Publish Your GPT

- **Privacy**:
  - "Only me" - Keep it private
  - "Anyone with the link" - Share with team
  - "Public" - List in GPT store

- Click **"Publish"** or **"Update"**

---

## 🧪 Step 4: Test Your Custom GPT

Try these queries in your new Custom GPT:

```
1. "What Amazon seller tools do you have access to?"
   → Should list all 31 MCP tools

2. "Show me information about ASIN B08N5WRWNW"
   → Should fetch catalog details

3. "What's my current FBA inventory?"
   → Should list your inventory summaries

4. "Get my orders from the last 7 days"
   → Should fetch recent orders
```

---

## 🔐 Security Best Practices

### ✅ DO:
- Keep your `CHATGPT_API_KEY` secret
- Use Railway's environment variables (never commit to git)
- Rotate API keys periodically
- Monitor Railway logs for suspicious activity
- Use HTTPS only (Railway provides this automatically)

### ❌ DON'T:
- Share your API key publicly
- Commit `.env` file to git
- Use the same key across multiple services
- Make your GPT public with your personal Amazon data

---

## 🛠️ Troubleshooting

### "Authentication failed" in Custom GPT

**Check**:
1. API key in GPT Actions matches your `.env` file
2. `CHATGPT_API_KEY` is set in Railway environment variables
3. Header name is exactly `X-API-Key` (case-sensitive)

**Fix**:
```bash
# Verify Railway environment variable
railway variables
```

### "Connection timeout" or "Cannot reach server"

**Check**:
1. Railway deployment is running:
   ```bash
   railway logs
   ```
2. Health endpoint responds:
   ```bash
   curl https://your-railway-url.railway.app/health
   ```

**Fix**:
```bash
# Redeploy if needed
railway up --detach
```

### "No tools available" in GPT

**Check**:
1. OpenAPI spec is accessible:
   ```bash
   curl https://your-railway-url.railway.app/openapi.json
   ```
2. GPT Actions schema imported correctly
3. Test MCP endpoint directly:
   ```bash
   curl -X POST https://your-railway-url.railway.app/mcp/messages \
     -H "Content-Type: application/json" \
     -H "X-API-Key: YOUR_KEY" \
     -d '{"method":"tools/list"}'
   ```

### "Tool call failed" errors

**Check Railway logs**:
```bash
railway logs --tail 100
```

Common issues:
- Amazon API credentials invalid
- Rate limiting
- Marketplace ID mismatch

---

## 📊 Available Tools (31 Total)

Your Custom GPT has access to all these Amazon SP-API tools:

### Catalog & Inventory (8 tools)
- Search Amazon catalog
- Get product details by ASIN
- Check FBA inventory levels
- Check FBM inventory
- Manage supply sources
- Create FBA shipments
- View shipment details

### Orders (4 tools)
- List orders (with filters)
- Get order details
- Get order items
- Get shipping address

### Reports (5 tools)
- Create reports
- Check report status
- Download reports
- List report types
- Cancel reports

### Listings & Pricing (6 tools)
- Get listing details
- Update listings
- Delete listings
- Get competitive pricing
- Check item offers
- View listing offers

### Finance & Feeds (5 tools)
- View financial events
- Submit feeds
- Check feed status
- Download feed results
- Cancel feeds

### Seller Info (3 tools)
- Get account details
- List marketplaces
- Verify authentication

---

## 💡 Usage Tips

### Optimize Your Prompts

**Instead of**: "What's my inventory?"
**Better**: "Show me my FBA inventory for all SKUs with quantity less than 10"

**Instead of**: "Get orders"
**Better**: "Get all orders from the last 7 days with status Pending"

### Batch Operations

The GPT can chain multiple tool calls:

```
"Give me a complete sales overview:
1. Today's orders
2. Current FBA inventory levels
3. Out of stock items
4. Pending shipments"
```

### Custom Reports

```
"Create an inventory report for the last 30 days, then tell me when it's ready and download it"
```

---

## 🔄 Updating Your GPT

When you add new features to the MCP server:

1. **Redeploy to Railway**:
   ```bash
   railway up
   ```

2. **Update GPT Actions**:
   - Go to your GPT settings
   - Actions → Edit
   - Re-import from `https://your-railway-url.railway.app/openapi.json`

3. **Test new tools** in GPT preview

---

## 📈 Monitoring & Logs

### View Real-Time Logs

```bash
railway logs --tail 50
```

### Monitor API Usage

```bash
# Check Railway metrics
railway status

# View deployment info
railway list
```

### Health Monitoring

Set up monitoring with Railway's dashboard:
1. Go to Railway project dashboard
2. Click on your service
3. View **Metrics** tab for:
   - CPU usage
   - Memory usage
   - Network requests
   - Response times

---

## 🎯 Next Steps

1. ✅ **Test all tool categories** in your Custom GPT
2. 📊 **Create custom workflows** for your Amazon business
3. 🔔 **Set up notifications** using the MCP notification tools
4. 🤝 **Share with your team** (if using "Anyone with link" privacy)
5. 🚀 **Build automation** by chaining tool calls

---

## 📚 Additional Resources

- **MCP Specification**: https://modelcontextprotocol.io
- **Amazon SP-API Docs**: https://developer-docs.amazon.com/sp-api/
- **Railway Docs**: https://docs.railway.app
- **OpenAI Custom GPTs**: https://help.openai.com/en/articles/8554407-gpts-faq

---

## 🆘 Need Help?

If you encounter issues:

1. Check this guide's Troubleshooting section
2. Review Railway logs: `railway logs`
3. Test endpoints manually with `curl`
4. Verify environment variables: `railway variables`

---

## 🎉 You're All Set!

Your Amazon seller operations are now integrated with ChatGPT! You can ask questions about your business and get real-time data from Amazon SP-API.

**Example conversation**:
```
You: "How's my business doing today?"

GPT: [Uses MCP tools to fetch]:
- Today's orders
- Current inventory levels
- Pending shipments
- Recent financial events

Then provides a comprehensive summary!
```

**Your API Key**: `YOUR_GENERATED_API_KEY_HERE`

**Keep this key secure!** 🔐
