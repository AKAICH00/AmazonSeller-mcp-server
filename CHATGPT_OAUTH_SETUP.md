# 🔐 ChatGPT Custom GPT Setup with OAuth 2.0

## Quick Setup for OpenAI Custom GPTs

Your MCP server now has **OAuth 2.0** and **SSE endpoint** support for ChatGPT Custom GPTs!

---

## 📍 Step 1: Get Your Railway URL

Once deployed, get your URL from Railway dashboard or:
```bash
https://your-project.railway.app
```

---

## 🤖 Step 2: Create Custom GPT

1. Go to https://chat.openai.com
2. Click **"My GPTs"** → **"Create a GPT"**
3. **Name**: Amazon Seller Assistant
4. **Description**: Manage Amazon seller account with real-time SP-API access

---

## 🔌 Step 3: Configure MCP Connector

In the **Configure** tab:

### Add MCP Server URL

Look for **"MCP Servers"** or **"Connectors"** section:

**Server URL**: `https://your-railway-url.railway.app/sse`

⚠️ **Important**: Use `/sse` endpoint (not `/mcp/messages`)

### Authentication Method

Choose **OAuth 2.0**:

**Authorization URL**:
```
https://your-railway-url.railway.app/oauth/authorize
```

**Token URL**:
```
https://your-railway-url.railway.app/oauth/token
```

**Client Authentication**: `Send client credentials in body`

**Scope**: `amazon-sp-api` (optional)

---

## 🎯 Alternative: API Key Method

If OAuth doesn't work or you prefer simpler auth:

**Server URL**: `https://your-railway-url.railway.app/sse`

**Authentication**: `API Key`

**Header Name**: `Authorization`

**Header Value**: `Bearer YOUR_GENERATED_API_KEY_HERE`

---

## ✅ Test Your Connection

Once configured, test in the GPT preview:

```
"List all available Amazon tools"
```

Should return all 31 MCP tools!

---

## 🔧 Troubleshooting

### "Connection timeout" error

**Cause**: Railway might not have finished deploying

**Fix**:
1. Wait 30-60 seconds for deployment to complete
2. Check Railway logs: `railway logs --tail 50`
3. Test health endpoint: `curl https://your-url/health`

### "Authentication failed"

**Cause**: Missing `CHATGPT_API_KEY` environment variable

**Fix**:
```bash
# Generate a key
node -e "console.log('sk-' + require('crypto').randomBytes(32).toString('hex'))"

# Add to Railway
railway variables set CHATGPT_API_KEY="<your-generated-key>"
```

### "Invalid endpoint" error

**Cause**: Wrong endpoint URL

**Fix**: Make sure you're using `/sse` (not `/mcp/messages` or `/openapi.json`)

**Correct**: `https://your-url.railway.app/sse`

### OAuth redirect error

**Cause**: OpenAI might not support OAuth redirect from your domain

**Solution**: Use API Key authentication instead (simpler and works reliably)

---

## 📊 Available Endpoints

| Endpoint | Purpose | Auth Required |
|----------|---------|---------------|
| `GET /health` | Health check | No |
| `GET /sse` | SSE connection (for ChatGPT) | Yes |
| `POST /sse` | SSE messages | Yes |
| `GET /oauth/authorize` | OAuth authorization | No |
| `POST /oauth/token` | OAuth token exchange | No |
| `POST /oauth/revoke` | OAuth token revocation | No |

---

## 🎉 Success Indicators

Your Custom GPT is working when:

✅ GPT can call `tools/list` and see 31 tools
✅ GPT can fetch catalog items
✅ GPT can get orders and inventory
✅ No timeout or authentication errors

---

## 💡 Usage Examples

Once configured, try these queries:

```
1. "What Amazon seller tools are available?"
2. "Show me my current FBA inventory"
3. "Get orders from the last 7 days"
4. "Check details for ASIN B08N5WRWNW"
5. "Generate a sales report for this month"
```

---

## 🔄 If You Need to Reconfigure

1. Edit your Custom GPT
2. Go to **Configure** → **MCP Servers** / **Connectors**
3. Update the URL or authentication
4. Click **"Update"**
5. Test again

---

## 📝 Summary

**What works now:**
- ✅ SSE endpoint at `/sse` for ChatGPT
- ✅ OAuth 2.0 authentication (full flow)
- ✅ API Key authentication (fallback)
- ✅ All 31 Amazon SP-API tools
- ✅ Real-time data from your Amazon account

**Next steps:**
1. Wait for Railway deployment to finish
2. Configure Custom GPT with `/sse` endpoint
3. Test with simple queries
4. Start managing your Amazon business with ChatGPT!

---

**Your Railway URL**: (get from Railway dashboard → Settings → Domains)

**SSE Endpoint**: `https://your-url.railway.app/sse`

**Keep it simple**: Use API Key auth for now, OAuth can be added later!
