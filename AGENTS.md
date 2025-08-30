# AGENTS.md

This file provides context and instructions to help AI coding agents work effectively on the Context7 MCP integration package.

## Project Overview

This is a Node.js package that provides Context7 MCP (Model Context Protocol) integration for AI-assisted development. The package enables AI assistants to access project standards, patterns, and configurations in real-time through a standardized MCP server interface.

**Key Components:**
- MCP Server for real-time Context7 integration
- CLI tool for project setup and management (`context7` command)
- Validation system for Context7 compliance
- Testing infrastructure for MCP functionality
- Code pattern generation for multiple frameworks

**Target Frameworks:** React, Vue, Svelte, Node.js APIs, JavaScript/TypeScript projects

## Dev Environment Tips

**Prerequisites:**
- Node.js >= 18.0.0
- npm or yarn package manager

**Setup Commands:**
```bash
# Install all dependencies
npm install

# Verify installation
npm run validate

# Test MCP server functionality
npm run test
```

**Development Workflow:**
```bash
# Start MCP server in development mode
npm run dev

# Test with CLI commands
npx context7 validate
npx context7 test-mcp
```

**Package Structure:**
- `src/server/` - MCP server implementation
- `src/validation/` - Context7 compliance validation
- `src/testing/` - MCP connection testing
- `bin/context7.js` - CLI entry point
- `templates/` - Configuration templates

## Testing Instructions

**No formal test suite exists yet** - this package uses functional testing through:

1. **MCP Server Testing:**
   ```bash
   npm run test  # Runs src/testing/MCPTester.js
   ```

2. **Validation Testing:**
   ```bash
   npm run validate  # Runs src/validation/Context7Validator.js
   ```

3. **CLI Testing:**
   ```bash
   # Test CLI commands manually
   npx context7 --help
   npx context7 init --help
   ```

**When adding tests:**
- Follow the existing pattern in `src/testing/MCPTester.js`
- Test MCP protocol compliance
- Validate Context7 standards integration
- Test CLI command functionality

## PR Instructions

**Commit Format:**
- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
- Keep commits atomic and well-described

**Pre-commit Validation:**
```bash
# Run before committing
npm run validate
npm run test

# Check code quality (when linting is set up)
npm run lint  # TODO: Configure ESLint
```

**Code Quality Requirements:**
- Follow existing ES module patterns
- Use async/await for asynchronous operations
- Maintain Context7 standards compliance
- Add JSDoc comments for public APIs
- Ensure CLI commands work across platforms

**Key Files to Validate:**
- `src/server/Context7MCPServer.js` - Core MCP server
- `bin/context7.js` - CLI functionality
- `package.json` - Dependencies and scripts
- `templates/` - Configuration templates

**Development Notes:**
- This is a pure ESM package (no build step required)
- MCP server uses stdio transport by default
- CLI auto-detects project types from package.json dependencies
- Configuration templates are copied from `templates/` directory