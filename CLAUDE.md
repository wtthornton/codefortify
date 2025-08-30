# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development and testing
npm run dev          # Start MCP server for development
npm run test         # Run MCP connection tests
npm run validate     # Validate Context7 compliance

# Package management
npm run build        # No build step required (pure ESM)
npm run prepublishOnly  # Runs tests before publishing
```

## Project Architecture

This is a Context7 MCP (Model Context Protocol) integration package that provides AI assistants with real-time access to project standards and patterns.

### Core Components

**MCP Server (`src/server/`)**:
- `Context7MCPServer.js` - Main MCP server class with resource/tool/prompt handlers
- `ResourceManager.js` - Handles Context7 standards and documentation resources
- `ToolManager.js` - Provides validation and pattern generation tools
- `PatternProvider.js` - Generates framework-specific code patterns

**CLI Interface (`bin/context7.js`)**:
- Full-featured CLI for project initialization and management
- Commands: `init`, `add`, `validate`, `test-mcp`, `serve`, `generate`, `update`
- Auto-detects project types (React, Vue, Node.js, etc.)

**Validation (`src/validation/Context7Validator.js`)**:
- Validates Context7 compliance and project structure
- Checks required files: AGENTS.md, CLAUDE.md, .agent-os/ directory

**Testing (`src/testing/MCPTester.js`)**:
- Tests MCP server functionality and connection handling

### Project Types Supported
- `react-webapp` - React applications with TypeScript/Tailwind
- `vue-webapp` - Vue 3 Composition API projects  
- `node-api` - Express/Fastify/Koa APIs
- `javascript` - General JavaScript/TypeScript projects

### Configuration Files
- `templates/configs/agent-os-config.yml` - Agent OS configuration template
- Generated files: `context7.config.js`, `src/mcp-server.js`, `AGENTS.md`

## Entry Points

- **CLI**: `bin/context7.js` - Main command-line interface
- **Package**: `src/index.js` - Exports all classes for programmatic use
- **MCP Server**: `src/server/Context7MCPServer.js` - Can run standalone

## Key Dependencies

- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `commander` - CLI framework
- `inquirer` - Interactive prompts
- `chalk`, `ora` - Terminal styling and spinners
- `fs-extra` - Enhanced filesystem operations