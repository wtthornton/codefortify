// Generated Context7 MCP Server for javascript

import { CodeFortifyMCPServer } from '../src/server/CodeFortifyMCPServer.js';

const server = new CodeFortifyMCPServer({
  projectRoot: process.cwd(),
  projectType: 'javascript',
  projectName: 'context7-mcp',
  codefortifyPath: '.codefortify'
});

server.start().catch(error => {
  // ERROR: Failed to start MCP server:, error
  process.exit(1);
});
