import http from 'http';
import { getAccessToken } from './utils/auth.js';

/**
 * Create a simple HTTP health check server
 * This runs alongside the MCP server for monitoring
 */
export function startHealthServer(port = process.env.PORT || 3000) {
  const server = http.createServer(async (req, res) => {
    // Health check endpoint
    if (req.url === '/health' || req.url === '/') {
      // Basic health check - just verify server is running
      // Don't check auth here to allow Railway deployment to succeed
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        service: 'Amazon SP-API MCP Server',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '1.0.0'
      }));
    }

    // Auth check endpoint - separate from health check
    else if (req.url === '/auth-status') {
      try {
        const token = await getAccessToken();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          auth: 'connected',
          tokenPreview: token ? token.substring(0, 20) + '...' : null,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          auth: 'failed',
          error: error.message,
          timestamp: new Date().toISOString()
        }));
      }
    }

    // Metrics endpoint
    else if (req.url === '/metrics') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        timestamp: new Date().toISOString()
      }));
    }

    // Not found
    else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Not Found',
        available_endpoints: ['/health', '/metrics']
      }));
    }
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`🏥 Health check server listening on port ${port}`);
    console.log(`   Health: http://0.0.0.0:${port}/health`);
    console.log(`   Metrics: http://0.0.0.0:${port}/metrics`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
      console.log('Health server closed');
      process.exit(0);
    });
  });

  return server;
}
