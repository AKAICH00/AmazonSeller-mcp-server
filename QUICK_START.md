# 🚀 Quick Start Guide

## Amazon SP-API MCP Server - ChatGPT Integration

### ✅ What's Done

Your MCP server now supports **Streamable HTTP transport** for ChatGPT Custom GPT integration!

---

## 🏃 Quick Deploy to Railway

```bash
cd /root/projects/AMAZON-MCP/AmazonSeller-mcp-server

# 1. Login to Railway
railway login

# 2. Link or create project
railway link
# OR for new project:
# railway init

# 3. Set environment variables
railway variables set CHATGPT_API_KEY="YOUR_GENERATED_API_KEY_HERE"
railway variables set SP_API_CLIENT_ID="$(grep SP_API_CLIENT_ID .env | cut -d '=' -f2)"
railway variables set SP_API_CLIENT_SECRET="$(grep SP_API_CLIENT_SECRET .env | cut -d '=' -f2)"
railway variables set SP_API_REFRESH_TOKEN="$(grep SP_API_REFRESH_TOKEN .env | cut -d '=' -f2)"
railway variables set SP_API_MARKETPLACE_ID="ATVPDKIKX0DER"
railway variables set SP_API_REGION="us-east-1"

# 4. Deploy
railway up

# 5. Get your public URL
railway domain
```

Save your Railway URL - you'll need it for ChatGPT!

---

## 🤖 Add to ChatGPT (5 Minutes)

### 1. Create Custom GPT

1. Go to https://chat.openai.com
2. Click **"My GPTs"** → **"Create a GPT"**
3. Name it: **Amazon Seller Assistant**

### 2. Add Actions

In the **Configure** tab:

1. Scroll to **"Actions"**
2. Click **"Create new action"**
3. **Import from URL**: `https://your-railway-url.railway.app/openapi.json`
4. **Authentication**:
   - Type: **API Key**
   - API Key: `YOUR_GENERATED_API_KEY_HERE`
   - Auth Type: **Custom**
   - Header Name: `X-API-Key`

### 3. Test

In the GPT preview:
```
"List all available Amazon tools"
```

Should return 31 tools!

### 4. Publish

Click **"Save"** → Choose privacy setting → **"Create"**

---

## 🧪 Test Your Deployment

```bash
# Get your Railway URL
RAILWAY_URL=$(railway domain)

# Test health (public endpoint)
curl https://$RAILWAY_URL/health

# Test OpenAPI spec (public endpoint)
curl https://$RAILWAY_URL/openapi.json

# Test MCP tools list (requires API key)
curl -X POST https://$RAILWAY_URL/mcp/messages \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_GENERATED_API_KEY_HERE" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

---

## 🔥 Example ChatGPT Queries

Once your Custom GPT is set up, try:

```
1. "What Amazon seller tools do you have?"
2. "Show me my FBA inventory levels"
3. "Get orders from the last 7 days"
4. "Check details for ASIN B08N5WRWNW"
5. "Create a sales report for last month"
```

---

## 📁 Files Reference

- **`src/http-server.js`** - Streamable HTTP server
- **`src/index.js`** - Original stdio server (for Claude Code)
- **`CHATGPT_SETUP_GUIDE.md`** - Complete setup guide
- **`.env`** - Your credentials (never commit!)
- **`Dockerfile`** - Railway deployment config

---

## 🔐 Your API Key

```
CHATGPT_API_KEY=YOUR_GENERATED_API_KEY_HERE
```

**Keep this secret!** This key protects your Amazon API access.

---

## 🚀 Run Locally (Testing)

```bash
# Start HTTP server
npm run start:http

# Test locally
curl http://localhost:3000/health
curl http://localhost:3000/openapi.json
```

---

## 📊 Available Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/health` | GET | No | Health check |
| `/openapi.json` | GET | No | OpenAPI spec for ChatGPT |
| `/mcp/tools` | GET | No | List tool categories |
| `/mcp/messages` | POST | Yes | MCP communication |
| `/mcp/messages` | GET | Yes | SSE stream (for sessions) |

---

## ✨ What Makes This Work

- ✅ **Streamable HTTP Transport** - Latest MCP standard (v1.19.1)
- ✅ **Session Management** - Efficient multi-request handling
- ✅ **API Key Auth** - Secure access control
- ✅ **SSE Support** - Real-time streaming responses
- ✅ **OpenAPI Spec** - Auto-discovered by ChatGPT
- ✅ **31 Amazon Tools** - Full SP-API coverage

---

## 🆘 Troubleshooting

### "Authentication failed"
- Check API key matches in both .env and ChatGPT Actions
- Verify Railway environment variable is set

### "Cannot connect"
- Railway deployment running? Check: `railway logs`
- Health endpoint working? Test: `curl https://your-url/health`

### "No tools available"
- OpenAPI spec loading? Visit: `https://your-url/openapi.json`
- Check Railway logs for errors

---

## 📚 Next Steps

1. ✅ Deploy to Railway (see above)
2. ✅ Create Custom GPT (5 minutes)
3. ✅ Test with real Amazon queries
4. 🎉 Start managing your Amazon business with ChatGPT!

---

**Ready to deploy?** Run the commands above and you'll have ChatGPT connected to your Amazon seller account in minutes!
