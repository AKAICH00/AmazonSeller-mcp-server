#!/usr/bin/env node
import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { server } from './server.js';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// API Key authentication middleware
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required. Use X-API-Key header or Authorization: Bearer <key>' });
  }

  // Check against environment variable
  const validApiKey = process.env.CHATGPT_API_KEY || process.env.API_KEY;

  if (!validApiKey) {
    console.error('ERROR: CHATGPT_API_KEY or API_KEY not set in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Constant-time comparison to prevent timing attacks
  const apiKeyBuffer = Buffer.from(apiKey);
  const validKeyBuffer = Buffer.from(validApiKey);

  if (apiKeyBuffer.length !== validKeyBuffer.length) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  if (!crypto.timingSafeEqual(apiKeyBuffer, validKeyBuffer)) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
};

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Amazon SP-API MCP Server',
    version: '1.0.0',
    transport: 'streamable-http',
    timestamp: new Date().toISOString()
  });
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
