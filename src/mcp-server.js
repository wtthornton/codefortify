// Generated Context7 MCP Server for javascript

import { Context7MCPServer } from '../src/server/Context7MCPServer.js';

const server = new Context7MCPServer({
  projectRoot: process.cwd(),
  projectType: 'javascript',
  projectName: 'context7-mcp'
});

server.start().catch(error => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
