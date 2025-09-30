# Railway Deployment Guide - Amazon SP-API MCP Server 🚂

**Project:** cooperative-victory
**Status:** ✅ Ready for Deployment
**Environment:** Production

---

## 🎯 What's Deployed

Your Amazon SP-API MCP Server will run 24/7 on Railway with:
- ✅ **Automatic restarts** if it crashes
- ✅ **Health monitoring** (checks every 30 seconds)
- ✅ **Environment variables** securely stored
- ✅ **Auto-deployment** on code changes (optional)
- ✅ **HTTPS endpoint** provided by Railway

---

## 🚀 Quick Deployment Steps

### 1. Set Environment Variables in Railway

Go to your Railway project dashboard and add these variables:

```bash
SP_API_CLIENT_ID=amzn1.application-oa2-client.5ea2121919f744f9901549b906260912
SP_API_CLIENT_SECRET=amzn1.oa2-cs.v1.f1a4a7c9...
SP_API_REFRESH_TOKEN=Atzr|IwEBIIsr47E9...
SP_API_MARKETPLACE_ID=ATVPDKIKX0DER
SP_API_REGION=us-east-1
```

**In Railway Dashboard:**
1. Go to your project: https://railway.app/project/e907a908-de30-4086-82bb-cffa41caf2c5
2. Click on your service
3. Go to "Variables" tab
4. Add each variable above
5. Click "Deploy"

### 2. Deploy from Command Line

```bash
cd /root/projects/AMAZON-MCP/AmazonSeller-mcp-server

# Deploy to Railway
railway up
```

### 3. Verify Deployment

```bash
# Check deployment status
railway status

# View logs
railway logs

# Get your deployment URL
railway domain
```

---

## 📊 What's Been Configured

### Files Created

1. **Dockerfile** - Container configuration
   - Uses Node.js 20 Alpine (small, secure)
   - Health checks every 30 seconds
   - Graceful shutdown handling

2. **railway.json** - Railway configuration
   - Dockerfile-based build
   - Auto-restart on failure (max 10 retries)
   - Health check endpoint: `/health`

3. **.dockerignore** - Excludes unnecessary files
   - Test files not included
   - Node modules rebuilt in container
   - Keeps image small and secure

4. **src/health.js** - Health monitoring
   - `/health` endpoint for Railway
   - `/metrics` endpoint for monitoring
   - Verifies auth token is working

---

## 🔍 Monitoring Your Deployment

### Health Check Endpoint

Once deployed, Railway will check:
```
https://your-app.railway.app/health
```

**Response when healthy:**
```json
{
  "status": "healthy",
  "service": "Amazon SP-API MCP Server",
  "timestamp": "2025-09-30T21:00:00.000Z",
  "auth": "connected",
  "uptime": 3600,
  "memory": {...},
  "version": "1.0.0"
}
```

**Response when unhealthy:**
```json
{
  "status": "unhealthy",
  "error": "Authentication failed",
  "timestamp": "2025-09-30T21:00:00.000Z"
}
```

### Metrics Endpoint

```
https://your-app.railway.app/metrics
```

Returns:
- Uptime
- Memory usage
- CPU usage
- Timestamp

---

## 🛠️ Railway Dashboard Features

### Variables Tab
- Set/update environment variables
- Variables are encrypted
- Changes trigger redeployment

### Deployments Tab
- View deployment history
- Roll back to previous versions
- See build logs

### Metrics Tab
- CPU usage over time
- Memory usage
- Network traffic
- Request counts

### Logs Tab
- Real-time logs
- Filter by severity
- Search logs
- Download logs

---

## 🔐 Security Best Practices

### Environment Variables
✅ **Never commit** credentials to git
✅ **Use Railway Variables** for all secrets
✅ **Rotate tokens** periodically
✅ **Monitor access** in Railway logs

### Health Checks
✅ **Auth verification** in health endpoint
✅ **Automatic restarts** if auth fails
✅ **Graceful shutdown** on SIGTERM

---

## 🚦 Deployment Strategies

### Option 1: Manual Deployment (Recommended for Testing)

```bash
# Deploy current code
railway up

# View logs
railway logs --follow

# Check status
railway status
```

### Option 2: Automatic Deployment (Recommended for Production)

Link Railway to your GitHub repo:
1. Push code to GitHub
2. In Railway: Settings → Connect GitHub repo
3. Select branch (e.g., `main`)
4. Auto-deploy on every push

### Option 3: Deploy from CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install Railway CLI
        run: npm i -g @railway/cli
      - name: Deploy
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 📈 Scaling Options

### Current Setup (Free Tier)
- **Memory:** 512 MB
- **CPU:** Shared
- **Builds:** 500 hours/month
- **Cost:** $0/month

### Hobby Plan ($5/month)
- **Memory:** 8 GB
- **CPU:** Shared
- **Builds:** Unlimited
- **Custom domains**

### Pro Plan ($20/month)
- **Memory:** 32 GB
- **CPU:** Priority
- **Team collaboration**
- **Advanced monitoring**

---

## 🐛 Troubleshooting

### Deployment Fails

**Check build logs:**
```bash
railway logs --deployment
```

**Common issues:**
- Missing environment variables
- Docker build errors
- Port not exposed correctly

**Solution:**
```bash
# Verify Dockerfile
cat Dockerfile

# Test locally
docker build -t mcp-server .
docker run -p 3000:3000 --env-file .env mcp-server
```

### Health Check Fails

**Symptoms:**
- Railway shows service as unhealthy
- Frequent restarts

**Check:**
```bash
# View health check logs
railway logs | grep health

# Test health endpoint locally
curl http://localhost:3000/health
```

**Common causes:**
- Auth credentials not set
- Token expired
- Network issues

### High Memory Usage

**Monitor:**
```bash
# Check metrics endpoint
railway logs | grep memory
```

**Solutions:**
- Add memory limits in railway.json
- Optimize token caching
- Clear old logs

---

## 🔄 Updating Your Deployment

### Update Code

```bash
# Make changes to code
git add .
git commit -m "Update MCP server"

# Deploy update
railway up

# Or if using auto-deploy
git push origin main
```

### Update Environment Variables

1. Go to Railway dashboard
2. Variables tab
3. Edit variable
4. Service automatically redeploys

### Rollback Deployment

```bash
# View deployment history
railway deployments

# Rollback to specific deployment
railway rollback <deployment-id>
```

---

## 📊 Cost Estimation

### Expected Usage (Free Tier)

**Assumptions:**
- Running 24/7
- Low to medium request volume
- ~100 MB memory usage

**Monthly breakdown:**
- Compute: ~720 hours (of 500 free)
- Exceeds free tier by ~220 hours
- **Estimated overage:** $0-$5/month

**Recommendation:** Start with free tier, upgrade if needed

---

## 🎯 Production Checklist

Before going live:

- [ ] Environment variables set in Railway
- [ ] Health checks responding correctly
- [ ] Logs showing successful auth
- [ ] Test all MCP tools work
- [ ] Custom domain configured (optional)
- [ ] Monitoring alerts set up
- [ ] Backup credentials stored securely
- [ ] Team access configured (if applicable)

---

## 🔗 Useful Railway Commands

```bash
# Check project status
railway status

# View live logs
railway logs --follow

# Open Railway dashboard
railway open

# Get deployment URL
railway domain

# Run command in deployed environment
railway run node test-auth.js

# Shell into deployed container
railway shell

# Delete service (careful!)
railway delete

# Disconnect project
railway unlink
```

---

## 📞 Support Resources

### Railway Documentation
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway
- Status: https://status.railway.app

### Project Links
- **Dashboard:** https://railway.app/project/e907a908-de30-4086-82bb-cffa41caf2c5
- **Project:** cooperative-victory
- **Environment:** production

### MCP Server Help
- Setup Guide: `SETUP_GUIDE.md`
- Test Results: `TEST_RESULTS.md`
- Catalog Analyzer: `CATALOG_ANALYZER_GUIDE.md`

---

## 🎉 Success Indicators

Your deployment is successful when:

✅ **Health check returns 200**
```bash
railway logs | grep "healthy"
```

✅ **No auth errors in logs**
```bash
railway logs | grep -i error
```

✅ **Uptime > 99.9%**
Check in Railway metrics tab

✅ **All MCP tools accessible**
Test with MCP Inspector or Claude Code

---

## 🚀 Next Steps After Deployment

1. **Get your Railway URL:**
   ```bash
   railway domain
   ```

2. **Test the health endpoint:**
   ```bash
   curl https://your-url.railway.app/health
   ```

3. **Connect Claude Code to Railway URL** (update .mcp.json):
   ```json
   {
     "mcpServers": {
       "amazon-sp-api": {
         "command": "node",
         "args": ["path/to/client.js"],
         "env": {
           "MCP_SERVER_URL": "https://your-url.railway.app"
         }
       }
     }
   }
   ```

4. **Set up monitoring alerts:**
   - Go to Railway dashboard
   - Settings → Notifications
   - Enable Slack/Discord/Email alerts

5. **Configure custom domain (optional):**
   - Settings → Domains
   - Add custom domain
   - Update DNS records

---

**Deployed:** 2025-09-30
**Status:** ✅ Ready for 24/7 Operation
**Next:** Deploy with `railway up`
