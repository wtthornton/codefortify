# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development and testing
npm run dev          # Start MCP server for development
npm run test         # Run comprehensive test suite with Vitest
npm run validate     # Validate Context7 compliance
npm run score        # Analyze project quality across 7 categories

# Code quality and formatting
npm run lint         # Run ESLint for code quality checks
npm run format       # Format code with Prettier
npm run type-check   # Run TypeScript type checking

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
- Commands: `init`, `add`, `validate`, `test-mcp`, `serve`, `generate`, `update`, `score`
- Auto-detects project types (React, Vue, Node.js, etc.)
- Integrated project quality scoring system with multiple output formats

**Validation (`src/validation/Context7Validator.js`)**:
- Validates Context7 compliance and project structure
- Checks required files: AGENTS.md, CLAUDE.md, .agent-os/ directory

**Scoring System (`src/scoring/`)**:
- `ProjectScorer.js` - Main scoring orchestrator with 7-category evaluation
- `ScoringReport.js` - Multi-format report generation (console, JSON, HTML)
- `RecommendationEngine.js` - Prioritized improvement suggestions
- `analyzers/` - 7 specialized analyzers for comprehensive quality assessment

**Testing (`src/testing/` & `tests/`)**:
- `MCPTester.js` - Tests MCP server functionality and connection handling
- Comprehensive test suite with Vitest, unit tests, integration tests
- GitHub Actions CI/CD pipeline for automated testing

### Project Types Supported
- `react-webapp` - React applications with TypeScript/Tailwind
- `vue-webapp` - Vue 3 Composition API projects  
- `node-api` - Express/Fastify/Koa APIs
- `javascript` - General JavaScript/TypeScript projects

### Configuration Files
- `templates/configs/agent-os-config.yml` - Agent OS configuration template
- Generated files: `context7.config.js`, `src/mcp-server.js`, `AGENTS.md`

## Project Quality Scoring

The integrated scoring system evaluates projects across 7 categories (100 points total):

### Scoring Categories
- **Code Structure & Architecture** (20pts) - File organization, module boundaries, naming conventions
- **Code Quality & Maintainability** (20pts) - ESLint/Prettier setup, documentation, complexity
- **Performance & Optimization** (15pts) - Bundle optimization, code splitting, lazy loading
- **Testing & Documentation** (15pts) - Test coverage, organization, testing frameworks
- **Security & Error Handling** (15pts) - Vulnerabilities, secrets management, error patterns
- **Developer Experience** (10pts) - Tooling setup, documentation quality, workflow
- **Completeness & Production Readiness** (5pts) - TODO completion, deployment configuration

### Usage Examples
```bash
# Basic scoring with console output
context7 score

# Detailed analysis with recommendations
context7 score --detailed --recommendations

# Generate JSON report for CI/CD integration
context7 score --format json --output results.json

# Create visual HTML report
context7 score --format html --output report.html

# Score specific categories only
context7 score --categories structure,quality,testing
```

## Entry Points

- **CLI**: `bin/context7.js` - Main command-line interface with scoring integration
- **Package**: `src/index.js` - Exports all classes for programmatic use
- **MCP Server**: `src/server/Context7MCPServer.js` - Can run standalone
- **Scoring**: `src/scoring/ProjectScorer.js` - Standalone project evaluation

## Key Dependencies

**Core Framework:**
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `commander` - CLI framework with scoring integration
- `inquirer` - Interactive prompts
- `chalk`, `ora` - Terminal styling and spinners
- `fs-extra` - Enhanced filesystem operations

**Testing & Quality:**
- `vitest` - Modern testing framework
- `eslint` - JavaScript/TypeScript linting
- `prettier` - Code formatting
- `@testing-library/react` - React component testing utilities

**Development Tools:**
- Node.js ESM modules throughout
- GitHub Actions CI/CD pipeline
- Comprehensive test coverage with unit and integration tests