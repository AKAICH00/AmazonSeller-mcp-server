# Technical Specification - Amazon SP-API MCP Server for ChatGPT

## Project Overview

**Goal**: Enable OpenAI Custom GPTs to access Amazon Selling Partner API through Model Context Protocol (MCP)

**Current Status**: Server deployed to Railway with SSE and OAuth endpoints, but OAuth not working correctly with ChatGPT Custom GPT interface

**Repository**: https://github.com/AKAICH00/AmazonSeller-mcp-server
**Deployment**: https://amazonseller-mcp-server-production.up.railway.app

---

## Architecture

### Technology Stack
- **Runtime**: Node.js 20 (Alpine Linux)
- **Framework**: Express.js 5.1.0
- **MCP SDK**: @modelcontextprotocol/sdk v1.19.1
- **Deployment**: Railway (auto-deploy from GitHub main branch)
- **Transport Protocols**:
  - Stdio (for Claude Code/Desktop)
  - Streamable HTTP (for general HTTP clients)
  - SSE (Server-Sent Events - for OpenAI Custom GPTs)

### Core Components

#### 1. MCP Server Core (`src/server.js`)
- Implements Model Context Protocol server
- Registers 31 Amazon SP-API tools across 6 categories:
  - Catalog & Inventory (8 tools)
  - Orders (4 tools)
  - Reports (5 tools)
  - Listings & Pricing (6 tools)
  - Finance & Feeds (5 tools)
  - Seller Info (3 tools)

#### 2. HTTP Server (`src/http-server.js`)
- Express application with multiple transport implementations
- Handles authentication (OAuth 2.0 + API Key)
- Routes SSE and HTTP requests to MCP server
- Serves OAuth endpoints and metadata

#### 3. OAuth Module (`src/oauth.js`)
- In-memory token storage (Map-based)
- Authorization code generation and validation
- Access token generation and validation
- Refresh token support
- Token revocation

#### 4. Amazon SP-API Integration (`src/tools/*`)
- OAuth-based authentication with Amazon SP-API
- 31 tool implementations for various SP-API endpoints
- Proper error handling and response formatting

---

## Current Implementation

### Endpoints

#### Public Endpoints (No Authentication)
```
GET  /health                                    - Health check
GET  /.well-known/oauth-authorization-server    - OAuth metadata discovery
GET  /sse/.well-known/oauth-authorization-server - Alternative OAuth metadata
GET  /mcp/tools                                 - Tool documentation
GET  /openapi.json                              - OpenAPI specification
```

#### OAuth Endpoints (No Authentication on OAuth flow)
```
GET  /oauth/authorize                           - OAuth authorization
POST /oauth/token                               - Token exchange/refresh
POST /oauth/revoke                              - Token revocation
```

#### SSE Endpoints
```
GET  /sse                                       - SSE stream connection (NO AUTH)
POST /sse                                       - SSE message handling (AUTH REQUIRED)
```

#### MCP Endpoints (Authentication Required)
```
GET  /mcp/messages                              - Streamable HTTP GET
POST /mcp/messages                              - Streamable HTTP POST
```

### Authentication Methods Implemented

#### 1. API Key Authentication
```javascript
// Header options:
Authorization: Bearer <api-key>
X-API-Key: <api-key>

// Validation:
- Constant-time comparison to prevent timing attacks
- Checks against CHATGPT_API_KEY environment variable
```

#### 2. OAuth 2.0 (Current Implementation)
```javascript
// Authorization Code Flow:
1. GET /oauth/authorize?client_id=X&redirect_uri=Y&response_type=code&state=Z
   → Generates authorization code
   → Redirects to ChatGPT callback with code

2. POST /oauth/token
   Body: {
     grant_type: "authorization_code",
     code: "<auth-code>",
     client_id: "<client-id>",
     client_secret: "<client-secret>"
   }
   → Returns access_token, refresh_token, expires_in

3. Authenticated requests:
   Authorization: Bearer <access-token>

4. Refresh:
   POST /oauth/token
   Body: {
     grant_type: "refresh_token",
     refresh_token: "<refresh-token>"
   }
```

### OAuth Token Format
```javascript
// Access Token
mcp_<64-char-hex>

// Refresh Token
mcpr_<64-char-hex>

// Token Lifetime
- Access Token: 3600 seconds (1 hour)
- Authorization Code: 600 seconds (10 minutes)
- Refresh Token: No expiration (until revoked)
```

### OAuth Metadata Response
```json
{
  "issuer": "https://amazonseller-mcp-server-production.up.railway.app",
  "authorization_endpoint": "https://amazonseller-mcp-server-production.up.railway.app/oauth/authorize",
  "token_endpoint": "https://amazonseller-mcp-server-production.up.railway.app/oauth/token",
  "revocation_endpoint": "https://amazonseller-mcp-server-production.up.railway.app/oauth/revoke",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "token_endpoint_auth_methods_supported": ["client_secret_post", "client_secret_basic"],
  "scopes_supported": ["amazon-sp-api"],
  "code_challenge_methods_supported": ["S256", "plain"]
}
```

---

## Issues Encountered

### 1. Initial Error: "Request timeout"
**Cause**: ChatGPT trying to connect to `/openapi.json` endpoint
**Solution**: Realized OpenAI uses SSE endpoint for MCP, not OpenAPI

### 2. Error: "MCP server does not implement OAuth"
**Cause**: Missing OAuth metadata discovery endpoint
**Solution**: Added `/.well-known/oauth-authorization-server` endpoint

### 3. Error: "401 Unauthorized on /sse"
**Cause**: SSE GET endpoint required authentication
**Solution**: Removed auth from GET /sse (SSE streams are public, POST requires auth)

### 4. Current Issue: OAuth Not Working
**Symptom**: ChatGPT Custom GPT interface shows OAuth config error or doesn't recognize OAuth
**Suspected Cause**: OpenAI Custom GPTs may have specific OAuth requirements not documented, or may not support OAuth for MCP connectors yet

---

## Environment Variables

### Required
```bash
# Amazon SP-API Credentials
SP_API_CLIENT_ID=amzn1.application-oa2-client.xxx
SP_API_CLIENT_SECRET=amzn1.oa2-cs.v1.xxx
SP_API_REFRESH_TOKEN=Atzr|xxx
SP_API_MARKETPLACE_ID=ATVPDKIKX0DER
SP_API_REGION=us-east-1

# MCP Server Authentication
CHATGPT_API_KEY=sk-<64-char-hex>

# Server Configuration
PORT=3000  # Set by Railway
```

### Optional
```bash
# OAuth Configuration (currently using defaults)
OAUTH_CLIENT_ID=amazon-mcp-server
OAUTH_CLIENT_SECRET=<auto-generated>
OAUTH_REDIRECT_URI=https://chat.openai.com/aip/g-<GPT-ID>/oauth/callback
```

---

## Data Flow

### SSE Connection Flow
```
1. ChatGPT → GET /sse
2. Server creates SSEServerTransport
3. Server calls transport.start()
4. Server sends session ID via SSE
5. ChatGPT receives session ID

6. ChatGPT → POST /sse (with session ID header + auth)
7. Server validates auth
8. Server routes to correct SSE transport
9. Transport handles MCP message
10. Response sent via SSE stream
```

### OAuth Flow (Theoretical)
```
1. ChatGPT → GET /.well-known/oauth-authorization-server
2. Server returns OAuth metadata

3. ChatGPT → GET /oauth/authorize?...
4. Server generates auth code
5. Server redirects to ChatGPT callback

6. ChatGPT → POST /oauth/token
7. Server validates auth code
8. Server returns access_token + refresh_token

9. ChatGPT → GET /sse (with Authorization: Bearer <token>)
10. Server validates token
11. SSE connection established
```

---

## File Structure

```
AmazonSeller-mcp-server/
├── src/
│   ├── index.js              # Stdio server (Claude Code)
│   ├── http-server.js        # HTTP/SSE server (ChatGPT) ⭐
│   ├── server.js             # MCP server core (shared)
│   ├── oauth.js              # OAuth implementation ⭐
│   ├── health.js             # Health endpoints
│   ├── tools/                # Amazon SP-API tool implementations
│   │   ├── auth.js
│   │   ├── catalog.js
│   │   ├── inventory.js
│   │   ├── orders.js
│   │   ├── reports.js
│   │   ├── feeds.js
│   │   ├── finance.js
│   │   ├── notifications.js
│   │   ├── seller.js
│   │   ├── fba.js
│   │   ├── product-pricing.js
│   │   └── listings.js
│   ├── resources/            # API documentation
│   │   └── api-docs.js
│   └── utils/                # Utilities
│       ├── auth.js
│       ├── report-poller.js
│       └── catalog-analyzer.js
├── Dockerfile                # Container build (uses http-server.js)
├── railway.json              # Railway deployment config
├── package.json              # Dependencies and scripts
└── .env                      # Environment variables (not committed)
```

---

## Authentication Flow Code

### Current Authenticate Middleware
```javascript
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const apiKey = req.headers['x-api-key'];

  // Try OAuth first
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    // Check if it's an OAuth token (starts with 'mcp_')
    if (token.startsWith('mcp_')) {
      const validation = validateAccessToken(token);
      if (validation.valid) {
        req.auth = { type: 'oauth', scope: validation.scope };
        return next();
      }
      return res.status(401).json({ error: validation.error });
    }

    // Otherwise treat as API key
    const validApiKey = process.env.CHATGPT_API_KEY;
    if (validApiKey && token === validApiKey) {
      req.auth = { type: 'api_key' };
      return next();
    }
  }

  // Try API Key header
  if (apiKey) {
    const validApiKey = process.env.CHATGPT_API_KEY;
    if (validApiKey && crypto.timingSafeEqual(
      Buffer.from(apiKey),
      Buffer.from(validApiKey)
    )) {
      req.auth = { type: 'api_key' };
      return next();
    }
  }

  return res.status(401).json({
    error: 'Authentication required'
  });
};
```

---

## What We Need

### Primary Goal
Implement OAuth 2.0 correctly according to OpenAI Custom GPT documentation for MCP connectors.

### Specific Questions
1. **Does OpenAI Custom GPT support OAuth for MCP servers?**
   - If yes, what are the exact requirements?
   - What OAuth discovery method does it use?
   - What OAuth flow is expected?

2. **OAuth Configuration in ChatGPT UI**
   - What authentication options appear in the Custom GPT builder?
   - Is there a specific OAuth option for MCP servers?
   - Or should we use standard "Action" OAuth configuration?

3. **SSE + OAuth Interaction**
   - Can OAuth tokens be sent on SSE GET requests?
   - Should auth happen on initial SSE connection or on POST messages?
   - What headers does ChatGPT send when using OAuth with SSE?

4. **Client Credentials**
   - Does ChatGPT generate its own client_id/client_secret?
   - Or should we provide static credentials?
   - How does the redirect_uri get configured?

### What's Working
- ✅ Server deployed and responding
- ✅ Health endpoint working
- ✅ SSE endpoint accepting connections
- ✅ OAuth metadata endpoint responding correctly
- ✅ OAuth authorization/token endpoints functional
- ✅ API Key authentication working
- ✅ All 31 Amazon SP-API tools implemented
- ✅ MCP protocol implementation correct

### What's Not Working
- ❌ ChatGPT Custom GPT doesn't recognize OAuth configuration
- ❌ Can't get past initial connector setup in ChatGPT UI
- ❌ Unclear if OAuth is even supported for MCP in Custom GPTs

---

## Testing Endpoints

### Health Check
```bash
curl https://amazonseller-mcp-server-production.up.railway.app/health
```

### OAuth Metadata
```bash
curl https://amazonseller-mcp-server-production.up.railway.app/.well-known/oauth-authorization-server
```

### SSE Connection
```bash
curl -N https://amazonseller-mcp-server-production.up.railway.app/sse
```

### OAuth Authorization (Manual Test)
```bash
# Open in browser:
https://amazonseller-mcp-server-production.up.railway.app/oauth/authorize?client_id=test&redirect_uri=https://example.com/callback&response_type=code&state=test123
```

---

## References

### OpenAI Documentation
- Custom GPT documentation: https://platform.openai.com/docs/mcp
- (Need to review for OAuth requirements)

### MCP Specification
- Official Spec: https://spec.modelcontextprotocol.io
- SSE Transport: https://spec.modelcontextprotocol.io/specification/2025-03-26/basic/transports/
- Streamable HTTP replaced SSE in v2025-03-26

### Our Implementation
- GitHub: https://github.com/AKAICH00/AmazonSeller-mcp-server
- Railway: https://amazonseller-mcp-server-production.up.railway.app

---

## Request for Help

**We need to implement OAuth correctly for OpenAI Custom GPTs.**

Please review:
1. OpenAI's MCP connector documentation
2. Required OAuth flow and configuration
3. How authentication should work with SSE endpoints
4. Any specific requirements for Custom GPT OAuth

Based on that, help us:
1. Fix our OAuth implementation to match OpenAI's requirements
2. Properly configure the ChatGPT Custom GPT interface
3. Get the MCP connector working with proper authentication

**Current Error**: "Error creating connector - 401 Unauthorized" or OAuth configuration not recognized

---

## Additional Context

### Why We Built This
- User wants to use ChatGPT (not Claude) to query Amazon Seller data
- Preserve Claude credits for development work
- Use ChatGPT Plus subscription for Amazon business queries
- All 31 Amazon SP-API tools should be available via ChatGPT

### What Makes This Complex
- MCP is a new protocol (2024)
- SSE transport is being deprecated but OpenAI might still use it
- OAuth + SSE interaction unclear
- OpenAI Custom GPT MCP documentation may be incomplete
- Need to bridge Amazon OAuth (SP-API) with MCP server OAuth

### Success Criteria
- ChatGPT Custom GPT can connect to our MCP server
- User can query: "Show me my FBA inventory" and get real data
- Authentication works reliably
- No credential exposure or security issues

---

**Created**: 2025-10-08
**Last Updated**: 2025-10-08
**Status**: Needs OAuth Implementation Fix
