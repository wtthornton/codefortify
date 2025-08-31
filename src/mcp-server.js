// Generated Context7 MCP Server for javascript

import { Context7MCPServer } from '../src/server/Context7MCPServer.js';

const server = new Context7MCPServer({
  projectRoot: '.',
  projectType: 'javascript'
});

server.start().catch(console.error);
