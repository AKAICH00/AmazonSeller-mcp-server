#!/bin/bash

# Amazon SP-API MCP Server - Railway Deployment Script
# This script helps deploy to Railway via GitHub

echo "🚂 Railway Deployment Helper"
echo "================================"
echo ""

# Check if we're in git repo
if [ ! -d .git ]; then
    echo "❌ Error: Not a git repository"
    exit 1
fi

# Check if git remote exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ Error: No git remote 'origin' configured"
    exit 1
fi

REMOTE_URL=$(git remote get-url origin)
echo "✅ Git remote: $REMOTE_URL"
echo ""

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes:"
    git status --short
    echo ""
    read -p "Commit these changes? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "Deploy to Railway: $(date +%Y-%m-%d)"
        echo "✅ Changes committed"
    fi
fi

# Check current branch
BRANCH=$(git branch --show-current)
echo "📍 Current branch: $BRANCH"
echo ""

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin $BRANCH

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Code pushed to GitHub successfully!"
    echo ""
    echo "🎯 Next Steps for Railway Deployment:"
    echo "================================"
    echo ""
    echo "1. Go to Railway Dashboard:"
    echo "   https://railway.app/project/e907a908-de30-4086-82bb-cffa41caf2c5"
    echo ""
    echo "2. Click '+ New Service'"
    echo ""
    echo "3. Select 'GitHub Repo'"
    echo ""
    echo "4. Choose: AKAICH00/AmazonSeller-mcp-server"
    echo ""
    echo "5. Configure:"
    echo "   - Root Directory: /"
    echo "   - Builder: Dockerfile"
    echo ""
    echo "6. Add Environment Variables:"
    echo "   Go to Variables tab and add:"
    echo "   - SP_API_CLIENT_ID"
    echo "   - SP_API_CLIENT_SECRET"
    echo "   - SP_API_REFRESH_TOKEN"
    echo "   - SP_API_MARKETPLACE_ID"
    echo "   - SP_API_REGION"
    echo ""
    echo "7. Deploy!"
    echo ""
    echo "📖 Full guide: RAILWAY_DEPLOYMENT.md"
else
    echo ""
    echo "❌ Failed to push to GitHub"
    echo "   Check your git credentials and try again"
    exit 1
fi
