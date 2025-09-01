// Generated Context7 MCP Server for javascript

import { CodeFortifyMCPServer } from '../src/server/CodeFortifyMCPServer.js';

const server = new CodeFortifyMCPServer({
  projectRoot: process.cwd(),
  projectType: 'javascript',
  projectName: 'context7-mcp'
});

server.start().catch(error => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
