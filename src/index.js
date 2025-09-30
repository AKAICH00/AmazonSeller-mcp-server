#!/usr/bin/env node
    import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
    import { server } from './server.js';
    import { startHealthServer } from './health.js';
    import dotenv from 'dotenv';

    // Load environment variables
    dotenv.config();

    console.log('Starting Amazon SP-API MCP server...');

    // Start health check server for Railway monitoring
    if (process.env.PORT || process.env.RAILWAY_ENVIRONMENT) {
      const port = process.env.PORT || 3000;
      startHealthServer(port);
      console.log(`Health server started on port ${port}`);
    }

    // Start receiving messages on stdin and sending messages on stdout
    const transport = new StdioServerTransport();
    await server.connect(transport);
