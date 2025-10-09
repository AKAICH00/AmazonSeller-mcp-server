#!/usr/bin/env node
import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { server } from './server.js';
import dotenv from 'dotenv';
import crypto from 'crypto';
import {
  OAUTH_CONFIG,
  generateAuthCode,
  validateAuthCode,
  generateAccessToken,
  validateAccessToken,
  refreshAccessToken,
  revokeToken
} from './oauth.js';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`, {
    userAgent: req.get('user-agent'),
    contentType: req.get('content-type'),
    origin: req.get('origin'),
    referer: req.get('referer')
  });
  next();
});

// Middleware
app.use(express.json());

// Authentication middleware - supports both OAuth and API Key
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
      res.setHeader('WWW-Authenticate', `Bearer realm="MCP Server", error="invalid_token", error_description="${validation.error || 'Invalid OAuth token'}"`);
      return res.status(401).json({ error: validation.error || 'Invalid OAuth token' });
    }

    // Otherwise treat as API key
    const validApiKey = process.env.CHATGPT_API_KEY || process.env.API_KEY;
    if (validApiKey && token === validApiKey) {
      req.auth = { type: 'api_key' };
      return next();
    }
  }

  // Try API Key header
  if (apiKey) {
    const validApiKey = process.env.CHATGPT_API_KEY || process.env.API_KEY;
    if (!validApiKey) {
      console.error('ERROR: CHATGPT_API_KEY or API_KEY not set in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Constant-time comparison
    const apiKeyBuffer = Buffer.from(apiKey);
    const validKeyBuffer = Buffer.from(validApiKey);

    if (apiKeyBuffer.length === validKeyBuffer.length && crypto.timingSafeEqual(apiKeyBuffer, validKeyBuffer)) {
      req.auth = { type: 'api_key' };
      return next();
    }
  }

  res.setHeader('WWW-Authenticate', 'Bearer realm="MCP Server", error="invalid_token"');
  return res.status(401).json({
    error: 'Authentication required',
    hint: 'Use OAuth 2.0 or API Key (X-API-Key header or Authorization: Bearer <key>)'
  });
};

// Legacy alias for backwards compatibility
const authenticateApiKey = authenticate;

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Amazon SP-API MCP Server',
    version: '1.0.0',
    transport: 'streamable-http + sse + oauth',
    timestamp: new Date().toISOString()
  });
});

// OAuth Configuration Discovery (for OpenAI Custom GPTs) - MCP compliant
app.get('/.well-known/oauth-authorization-server', (req, res) => {
  const baseUrl = `https://${req.get('host')}`;

  console.log('🔍 OAuth metadata request:', {
    userAgent: req.get('user-agent'),
    host: req.get('host'),
    headers: req.headers
  });

  const metadata = {
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    revocation_endpoint: `${baseUrl}/oauth/revoke`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: ['none', 'client_secret_post', 'client_secret_basic'],
    scopes_supported: ['amazon-sp-api'],
    code_challenge_methods_supported: ['S256']
  };

  console.log('📤 Sending OAuth metadata:', metadata);
  res.json(metadata);
});

// OAuth metadata at /sse/.well-known path (alternative discovery) - MCP compliant
app.get('/sse/.well-known/oauth-authorization-server', (req, res) => {
  const baseUrl = `https://${req.get('host')}`;

  res.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    revocation_endpoint: `${baseUrl}/oauth/revoke`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: ['none', 'client_secret_post', 'client_secret_basic'],
    scopes_supported: ['amazon-sp-api'],
    code_challenge_methods_supported: ['S256']
  });
});

// OAuth 2.0 Authorization Endpoint with PKCE support
app.get('/oauth/authorize', (req, res) => {
  const { client_id, redirect_uri, response_type, scope, state, code_challenge, code_challenge_method } = req.query;

  console.log('🔐 OAuth authorization request:', {
    client_id,
    redirect_uri,
    response_type,
    scope,
    state,
    code_challenge: code_challenge ? code_challenge.substring(0, 10) + '...' : 'none',
    code_challenge_method,
    userAgent: req.get('user-agent')
  });

  // Validate required parameters
  if (!client_id || !redirect_uri || response_type !== 'code') {
    console.log('❌ Invalid OAuth authorization request - missing parameters');
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'Missing or invalid required parameters'
    });
  }

  // Validate PKCE parameters if provided
  if (code_challenge && code_challenge_method !== 'S256') {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'Only S256 code_challenge_method is supported'
    });
  }

  // In production, you'd validate client_id and redirect_uri against registered clients
  // For now, we auto-approve

  // Generate authorization code with PKCE support
  const code = generateAuthCode(code_challenge, code_challenge_method);

  // Redirect back to ChatGPT with code
  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.append('code', code);
  if (state) {
    redirectUrl.searchParams.append('state', state);
  }

  res.redirect(redirectUrl.toString());
});

// OAuth 2.0 Token Endpoint with PKCE support
app.post('/oauth/token', express.urlencoded({ extended: true }), (req, res) => {
  const { grant_type, code, refresh_token, client_id, client_secret, code_verifier } = req.body;

  // Handle authorization_code grant
  if (grant_type === 'authorization_code') {
    if (!code) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing authorization code'
      });
    }

    // Validate authorization code with PKCE verification
    const validation = validateAuthCode(code, code_verifier);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: validation.error
      });
    }

    // Generate and return tokens
    const tokens = generateAccessToken();
    return res.json(tokens);
  }

  // Handle refresh_token grant
  if (grant_type === 'refresh_token') {
    if (!refresh_token) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing refresh token'
      });
    }

    // Refresh the token
    const result = refreshAccessToken(refresh_token);
    if (!result.success) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: result.error
      });
    }

    return res.json(result.tokens);
  }

  return res.status(400).json({
    error: 'unsupported_grant_type',
    error_description: 'Only authorization_code and refresh_token grants are supported'
  });
});

// OAuth 2.0 Revocation Endpoint
app.post('/oauth/revoke', express.urlencoded({ extended: true }), (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'Missing token'
    });
  }

  revokeToken(token);
  res.status(200).json({ success: true });
});

// CORS headers for ChatGPT
app.use('/mcp', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Store sessions for stateful mode (optional)
const sessions = new Map();
const sseTransports = new Map();

// SSE endpoint for OpenAI Custom GPTs - GET establishes stream, POST sends messages
// Note: GET doesn't require auth (SSE streams are public), POST requires auth
app.get('/sse', async (req, res) => {
  try {
    console.log('🌊 SSE connection request:', {
      userAgent: req.get('user-agent'),
      query: req.query,
      headers: req.headers
    });

    // Create a new SSE transport
    const transport = new SSEServerTransport('/sse', res, {
      enableDnsRebindingProtection: false
    });

    // Store transport by session ID
    sseTransports.set(transport.sessionId, transport);

    // Clean up on close
    transport.onclose = () => {
      console.log(`SSE session closed: ${transport.sessionId}`);
      sseTransports.delete(transport.sessionId);
    };

    // Connect MCP server to this transport (start() is called automatically)
    await server.connect(transport);

    console.log(`SSE session started: ${transport.sessionId}`);
  } catch (error) {
    console.error('Error in SSE connection:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'SSE connection failed', message: error.message });
    }
  }
});

app.post('/sse', authenticateApiKey, async (req, res) => {
  try {
    const sessionId = req.headers['mcp-session-id'];

    if (!sessionId || !sseTransports.has(sessionId)) {
      return res.status(404).json({ error: 'Session not found. Establish SSE connection first (GET /sse)' });
    }

    const transport = sseTransports.get(sessionId);
    await transport.handlePostMessage(req, res, req.body);

    console.log(`SSE message processed for session: ${sessionId}`);
  } catch (error) {
    console.error('Error processing SSE message:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'SSE message failed', message: error.message });
    }
  }
});

// MCP endpoint with authentication - supports both GET and POST
app.all('/mcp/messages', authenticateApiKey, async (req, res) => {
  try {
    console.log('Received MCP request:', {
      method: req.method,
      timestamp: new Date().toISOString()
    });

    // Get or create session
    const sessionId = req.headers['mcp-session-id'];
    let transport;

    if (sessionId && sessions.has(sessionId)) {
      // Reuse existing session
      transport = sessions.get(sessionId);
    } else {
      // Create new transport for this session/request
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: (id) => {
          console.log(`Session initialized: ${id}`);
          sessions.set(id, transport);
        },
        onsessionclosed: (id) => {
          console.log(`Session closed: ${id}`);
          sessions.delete(id);
        },
        enableJsonResponse: false // Use SSE for streaming
      });

      // Connect the MCP server to this transport
      await server.connect(transport);
    }

    // Let the transport handle the HTTP request/response
    await transport.handleRequest(req, res, req.body);

    console.log('MCP request processed successfully');
  } catch (error) {
    console.error('Error processing MCP request:', error);

    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
});

// API documentation endpoint (no auth required)
app.get('/mcp/tools', (req, res) => {
  res.json({
    info: {
      name: 'Amazon SP-API MCP Server',
      version: '1.0.0',
      description: 'Model Context Protocol server for Amazon Selling Partner API',
      transport: 'streamable-http'
    },
    authentication: {
      type: 'api_key',
      in: 'header',
      name: 'X-API-Key',
      alternative: 'Authorization: Bearer <key>'
    },
    endpoints: {
      health: 'GET /health',
      mcp: 'POST /mcp/messages',
      tools: 'GET /mcp/tools (this endpoint)'
    },
    categories: [
      'Authentication',
      'Catalog & Inventory',
      'Orders',
      'Reports',
      'Feeds',
      'Finance',
      'Notifications',
      'Product Pricing',
      'Listings',
      'FBA Operations',
      'Seller Info'
    ],
    toolCount: 31,
    setup: {
      chatgpt: 'Add as Custom GPT Action with POST /mcp/messages',
      authentication: 'Set X-API-Key header with your API key'
    }
  });
});

// OpenAPI/Swagger spec for ChatGPT Actions (no auth required)
app.get('/openapi.json', (req, res) => {
  const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${port}`;

  res.json({
    openapi: '3.1.0',
    info: {
      title: 'Amazon SP-API MCP Server',
      description: 'Model Context Protocol server for Amazon Selling Partner API. Provides 31 tools for managing catalog, inventory, orders, reports, and more.',
      version: '1.0.0'
    },
    servers: [
      {
        url: baseUrl,
        description: 'MCP Server'
      }
    ],
    paths: {
      '/mcp/messages': {
        post: {
          summary: 'Send MCP message',
          description: 'Main endpoint for Model Context Protocol communication. Supports all Amazon SP-API tools.',
          operationId: 'sendMcpMessage',
          security: [
            { apiKey: [] }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['method'],
                  properties: {
                    method: {
                      type: 'string',
                      description: 'MCP method to call',
                      enum: ['tools/list', 'tools/call', 'resources/list', 'resources/read']
                    },
                    params: {
                      type: 'object',
                      description: 'Parameters for the MCP method'
                    }
                  }
                },
                examples: {
                  listTools: {
                    summary: 'List available tools',
                    value: {
                      method: 'tools/list'
                    }
                  },
                  callTool: {
                    summary: 'Call a tool',
                    value: {
                      method: 'tools/call',
                      params: {
                        name: 'getCatalogItem',
                        arguments: {
                          asin: 'B08N5WRWNW'
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object'
                  }
                }
              }
            },
            '401': {
              description: 'Missing API key'
            },
            '403': {
              description: 'Invalid API key'
            },
            '500': {
              description: 'Internal server error'
            }
          }
        }
      },
      '/health': {
        get: {
          summary: 'Health check',
          description: 'Check server status',
          operationId: 'healthCheck',
          responses: {
            '200': {
              description: 'Server is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                      service: { type: 'string' },
                      version: { type: 'string' },
                      transport: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for authentication. Set CHATGPT_API_KEY environment variable on server.'
        }
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    availableEndpoints: {
      health: 'GET /health',
      mcp: 'POST /mcp/messages',
      tools: 'GET /mcp/tools',
      openapi: 'GET /openapi.json'
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`\n🚀 Amazon SP-API MCP Server (Streamable HTTP)`);
  console.log(`📡 Listening on port ${port}`);
  console.log(`\n📍 Endpoints:`);
  console.log(`   Health:  http://localhost:${port}/health`);
  console.log(`   MCP:     http://localhost:${port}/mcp/messages`);
  console.log(`   Tools:   http://localhost:${port}/mcp/tools`);
  console.log(`   OpenAPI: http://localhost:${port}/openapi.json`);
  console.log(`\n🔐 Authentication: X-API-Key header required for /mcp/* endpoints`);
  console.log(`   Set CHATGPT_API_KEY or API_KEY in .env file\n`);
});

export default app;
