# 🚀 Deploy to Railway NOW - Quick Guide

Your MCP server is **ready to deploy** to Railway for 24/7 operation!

---

## ✅ What's Ready

All deployment files are configured:
- ✅ Dockerfile created
- ✅ railway.json configured
- ✅ Health checks added
- ✅ .dockerignore optimized
- ✅ Project linked to Railway

---

## 🚂 Deploy in 3 Steps

### Step 1: Push Code to GitHub

```bash
# Commit deployment files
git add .
git commit -m "Add Railway deployment configuration"
git push origin main
```

### Step 2: Create Service in Railway

1. **Go to Railway Dashboard:**
   https://railway.app/project/e907a908-de30-4086-82bb-cffa41caf2c5

2. **Click: "+ New Service"**

3. **Select: "GitHub Repo"**

4. **Choose:** `AKAICH00/AmazonSeller-mcp-server`

5. **Settings:**
   - Root Directory: `/` (default)
   - Builder: `Dockerfile` (auto-detected)

### Step 3: Add Environment Variables

In Railway dashboard, go to **Variables** tab and add:

```
SP_API_CLIENT_ID=amzn1.application-oa2-client.5ea2121919f744f9901549b906260912
SP_API_CLIENT_SECRET=amzn1.oa2-cs.v1.f1a4a7c9...
SP_API_REFRESH_TOKEN=Atzr|IwEBIIsr47E9...
SP_API_MARKETPLACE_ID=ATVPDKIKX0DER
SP_API_REGION=us-east-1
```

**Railway will auto-deploy!** 🎉

---

## 🔍 Verify Deployment

### Check Health

Once deployed, Railway gives you a URL like:
```
https://amazonseller-mcp-server-production.up.railway.app
```

Test the health endpoint:
```bash
curl https://your-url.railway.app/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "service": "Amazon SP-API MCP Server",
  "auth": "connected",
  "uptime": 123
}
```

### View Logs

In Railway dashboard:
1. Click your service
2. Go to "Deployments" tab
3. Click latest deployment
4. View logs in real-time

---

## ⚡ Alternative: One-Command Deploy

Use the helper script:

```bash
./deploy-railway.sh
```

This will:
1. Check for uncommitted changes
2. Commit if needed
3. Push to GitHub
4. Show you the next steps

---

## 📊 After Deployment

### Get Your Public URL

```bash
railway domain
```

Or in Railway dashboard → Settings → Domains

### Monitor Your Server

**Health Check:**
```bash
watch -n 5 curl https://your-url.railway.app/health
```

**Logs:**
```bash
railway logs --follow
```

**Status:**
```bash
railway status
```

---

## 🎯 Connect Claude Code to Railway

Update your local `.mcp.json`:

```json
{
  "mcpServers": {
    "amazon-sp-api-production": {
      "url": "https://your-url.railway.app",
      "transport": "http"
    }
  }
}
```

Now Claude Code connects to your 24/7 server instead of local!

---

## 💰 Cost

**Free Tier includes:**
- 500 hours compute/month
- $5 credit/month
- Shared CPU

**Your usage:**
- Running 24/7 = ~720 hours/month
- Estimated cost: $0-$5/month

**Upgrade anytime:**
- Hobby: $5/month (8GB RAM, priority)
- Pro: $20/month (32GB RAM, teams)

---

## 🆘 Troubleshooting

### Deployment Fails?

**Check build logs in Railway:**
1. Deployments tab
2. Click failed deployment
3. View logs

**Common issues:**
- Missing environment variables → Add them in Variables tab
- Dockerfile error → Check Dockerfile syntax
- Port not exposed → Verify PORT env variable

### Health Check Fails?

**Check logs for errors:**
```bash
railway logs | grep error
```

**Common causes:**
- Credentials not set
- Auth token expired
- Network connectivity

**Fix:**
1. Verify all env variables are set
2. Check credentials are correct
3. Restart deployment

---

## 📖 Full Documentation

- **RAILWAY_DEPLOYMENT.md** - Complete deployment guide
- **SETUP_GUIDE.md** - Initial setup
- **CATALOG_ANALYZER_GUIDE.md** - Using the catalog tool

---

## 🎉 You're Ready!

Everything is configured and ready to deploy. Just follow the 3 steps above and your MCP server will be running 24/7 on Railway!

**Questions?** Check RAILWAY_DEPLOYMENT.md for detailed info.

---

**Quick Start:**
```bash
git add .
git commit -m "Deploy to Railway"
git push origin main
# Then add service in Railway dashboard!
```
