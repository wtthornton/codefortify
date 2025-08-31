# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development and testing
npm run dev          # Start MCP server for development
npm run test         # Run comprehensive test suite with Vitest
npm run coverage     # Generate test coverage reports with c8
npm run test:integration  # Run MCP server integration tests
npm run validate     # Validate Context7 compliance
npm run score        # Analyze project quality across 7 categories

# Performance and bundle analysis
npm run analyze      # Comprehensive package size analysis
npm run size-check   # Monitor package size limits and warnings

# Code quality and formatting
npm run lint         # Run ESLint for code quality checks
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Format code with Prettier
npm run audit        # Security vulnerability scanning

# Production and deployment
npm run build        # No build step needed (ESM package)
npm run start        # Start CLI (same as context7 command)
npm run prepublishOnly  # Runs tests before publishing
```

## Project Architecture

This is a Context7 MCP (Model Context Protocol) integration package that provides AI assistants with real-time access to project standards and patterns.

### Core Components

**MCP Server (`src/server/`)**:
- `Context7MCPServer.js` - Main MCP server class with resource/tool/prompt handlers
- `ResourceManager.js` - Handles Context7 standards and documentation resources
- `ToolManager.js` - Provides validation and pattern generation tools
- `PatternProvider.js` - Orchestrates pattern generation across frameworks
- `patterns/` - Modular pattern system with framework-specific implementations:
  - `ReactPatterns.js` - React components, hooks, and testing patterns
  - `VuePatterns.js` - Vue Composition API and component patterns
  - `NodePatterns.js` - Express routes, services, and middleware patterns

**CLI Interface (`bin/context7.js`)**:
- Full-featured CLI for project initialization and management
- Commands: `init`, `add`, `validate`, `test-mcp`, `serve`, `generate`, `update`, `score`
- Auto-detects project types (React, Vue, Node.js, etc.)
- Integrated project quality scoring system with multiple output formats

**Validation (`src/validation/Context7Validator.js`)**:
- Validates Context7 compliance and project structure
- Checks required files: AGENTS.md, CLAUDE.md

**Scoring System (`src/scoring/`)**:
- `ProjectScorer.js` - Main scoring orchestrator with 7-category evaluation and smart project detection
- `ScoringReport.js` - Multi-format report generation (console, JSON, HTML)
- `RecommendationEngine.js` - Prioritized improvement suggestions
- `analyzers/` - 7 specialized analyzers with real tool integration:
  - Enhanced pattern recognition for advanced architecture patterns
  - Real npm audit integration for vulnerability scanning
  - ESLint API integration for actual code quality metrics
  - c8/nyc/jest integration for true test coverage analysis
  - Deep Context7/MCP compliance validation

**Testing (`src/testing/` & `tests/`)**:
- `MCPTester.js` - Tests MCP server functionality and connection handling
- `tests/integration/` - Full MCP server integration testing with resource/tool workflows
- Comprehensive test suite with Vitest, c8 coverage integration, unit and integration tests
- GitHub Actions CI/CD pipeline for automated testing
- Real-time MCP server testing with timeout and error handling

### Project Types Supported
- `react-webapp` - React applications with TypeScript/Tailwind
- `vue-webapp` - Vue 3 Composition API projects  
- `node-api` - Express/Fastify/Koa APIs
- `javascript` - General JavaScript/TypeScript projects

### Configuration Files
- Generated files: `context7.config.js`, `src/mcp-server.js`, `AGENTS.md`

## Project Quality Scoring

The integrated scoring system evaluates projects across 7 categories (100 points total):

### Scoring Categories with Real Tool Integration
- **Code Structure & Architecture** (20pts) - File organization, advanced pattern detection (MVC, Service Layer, Repository Pattern, etc.)
- **Code Quality & Maintainability** (20pts) - Real ESLint API analysis with error/warning counts, TypeScript integration
- **Performance & Optimization** (15pts) - Bundle optimization, code splitting, lazy loading
- **Testing & Documentation** (15pts) - Real coverage metrics via c8/nyc/jest, test organization analysis  
- **Security & Error Handling** (15pts) - npm audit vulnerability scanning, secrets management, error patterns
- **Developer Experience** (10pts) - Tooling setup, documentation quality, workflow optimization
- **Completeness & Production Readiness** (5pts) - Deep Context7/MCP compliance validation, production readiness

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

# Create HTML report and automatically open in browser
context7 score --format html --output report.html --open

# Score specific categories only
context7 score --categories structure,quality,testing
```

### Advanced Features (Phase 1 + Quick Wins)

**Real Tool Integration:**
- Replaces pattern matching with actual tool APIs for accurate analysis
- npm audit for CVE vulnerability scanning with severity levels
- ESLint API integration providing real error/warning counts and rule violations
- Coverage tools (c8, nyc, jest) for accurate line/branch/function coverage metrics

**Enhanced Pattern Recognition:**
- Detects 16+ advanced architecture patterns: MVC, Service Layer, Repository Pattern, Observer Pattern, Factory Pattern, Strategy Pattern, Middleware, State Management, Error Boundaries, etc.
- Smart project type detection (React, Vue, Node.js, MCP servers, CLI tools, libraries)
- Framework-specific validation with appropriate scoring adjustments

**Deep Context7/MCP Compliance:**
- AGENTS.md structure validation with required sections
- CLAUDE.md content quality analysis  
- MCP server implementation quality assessment
- Agent OS configuration validation

**Graceful Degradation:**
- Intelligent fallback to pattern matching when tools unavailable
- Helpful installation guidance for missing dependencies
- Tool availability checking with setup recommendations
- Non-blocking analysis when external tools fail

### Performance & Quality Improvements
- **Industry-grade accuracy** replacing surface-level analysis
- **Professional credibility** with real tool integration
- **Actionable insights** with specific error counts and recommendations
- **Zero external dependencies** using built-in Node.js tools

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

**Performance & Analysis:**
- `c8` - Advanced test coverage reporting with line/branch/function metrics
- `webpack-bundle-analyzer` - Bundle size analysis and optimization
- Custom bundle analysis scripts with size monitoring and recommendations

**Development Tools:**
- Node.js ESM modules throughout
- GitHub Actions CI/CD pipeline
- Comprehensive test coverage with c8 integration
- Professional bundle analysis and performance monitoring
- Security vulnerability scanning with npm audit integration