# AGENTS.md

This file provides context and instructions to help AI coding agents work effectively on the Context7 MCP integration package.

## Project Overview

This is a Node.js package that provides Context7 MCP (Model Context Protocol) integration for AI-assisted development. The package enables AI assistants to access project standards, patterns, and configurations in real-time through a standardized MCP server interface.

**Key Components:**
- MCP Server for real-time Context7 integration with modular pattern system
- CLI tool for project setup and management (`context7` command)
- Enhanced project quality scoring system with real tool integration (7 categories)
- Validation system for Context7 compliance
- Professional testing infrastructure with Vitest and c8 coverage
- Modular code pattern generation (React, Vue, Node.js patterns)
- Bundle analysis and performance monitoring tools
- Security scanning with npm audit integration

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
npx context7 score --detailed --recommendations

# Enhanced quality and performance analysis
npm run lint            # ESLint code quality
npm run lint:fix        # Auto-fix linting issues
npm run format          # Prettier formatting
npm run coverage        # c8 test coverage reports
npm run analyze         # Bundle size analysis
npm run size-check      # Package size monitoring
npm run audit           # Security vulnerability scanning
```

**Package Structure:**
- `src/server/` - MCP server implementation
  - `patterns/` - Modular pattern system (ReactPatterns.js, VuePatterns.js, NodePatterns.js)
- `src/scoring/` - Enhanced project quality scoring system
  - `analyzers/` - 7 specialized quality analyzers with real tool integration
- `src/validation/` - Context7 compliance validation
- `src/testing/` - MCP connection testing
- `tests/` - Comprehensive test suite with Vitest and c8 coverage
  - `integration/` - Full MCP server integration tests
- `bin/context7.js` - CLI entry point with enhanced scoring integration
- `templates/` - Configuration templates
- `scripts/` - Bundle analysis and performance monitoring tools

## Testing Instructions

**Comprehensive test suite** using Vitest with unit, integration, and MCP server tests:

1. **Full Test Suite:**
   ```bash
   npm run test           # Run all tests with Vitest
   npm run coverage       # Run tests with c8 coverage reports
   npm run test:integration  # Run MCP server integration tests
   npm run test:watch     # Run tests in watch mode
   npm run test:ui        # Run tests with Vitest UI
   ```

2. **Specific Test Categories:**
   ```bash
   npm run test tests/unit/           # Unit tests only
   npm run test tests/integration/    # Integration tests only
   npm run test tests/cli/            # CLI command tests
   ```

3. **Manual Testing:**
   ```bash
   npx context7 --help        # CLI help
   npx context7 validate      # Context7 compliance
   npx context7 score         # Project quality scoring
   ```

**Test Structure:**
- `tests/unit/` - Unit tests for individual classes
- `tests/integration/` - Comprehensive MCP server integration tests with resource/tool workflows
- `tests/cli/` - CLI command functionality tests with enhanced error handling
- `tests/fixtures/` - Test data and mock projects
- Coverage reports generated in `coverage/` directory with c8

**When adding tests:**
- Follow Vitest patterns with `describe`, `it`, `expect`
- Use `tests/setup.js` for test configuration
- Mock external dependencies appropriately
- Test both success and error scenarios
- Include tests for new scoring analyzers

## PR Instructions

**Commit Format:**
- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
- Keep commits atomic and well-described

**Pre-commit Validation:**
```bash
# Run before committing
npm run validate      # Context7 compliance
npm run test         # Full test suite
npm run coverage     # Test coverage with c8
npm run lint         # ESLint code quality
npm run format       # Prettier formatting
npm run audit        # Security vulnerability scanning
npm run size-check   # Package size monitoring
npm run score --detailed --recommendations  # Project quality analysis
```

**Code Quality Requirements:**
- Follow existing ES module patterns
- Use async/await for asynchronous operations
- Maintain Context7 standards compliance
- Add JSDoc comments for public APIs
- Ensure CLI commands work across platforms
- Follow ESLint and Prettier configurations
- Write tests for new functionality
- Maintain scoring system analyzer patterns

**Key Files to Validate:**
- `src/server/Context7MCPServer.js` - Core MCP server
- `src/server/patterns/` - Modular pattern system (React, Vue, Node.js)
- `src/scoring/ProjectScorer.js` - Enhanced scoring system orchestrator
- `src/scoring/analyzers/` - Quality analyzers (7 classes with real tool integration)
- `bin/context7.js` - CLI functionality with enhanced scoring integration
- `tests/integration/` - MCP server integration tests
- `scripts/` - Bundle analysis and performance monitoring
- `package.json` - Dependencies and npm scripts
- `templates/` - Configuration templates

## Project Quality Scoring System

**Enhanced scoring system with real tool integration** evaluates projects across 7 categories (100 points total):

**Scoring Architecture:**
- `ProjectScorer.js` - Main orchestrator with category management
- `ScoringReport.js` - Multi-format output generation (console, JSON, HTML)
- `RecommendationEngine.js` - Prioritized improvement suggestions
- `BaseAnalyzer.js` - Abstract base class for all analyzers

**7 Enhanced Analyzer Categories:**
1. **StructureAnalyzer** (20pts) - Advanced pattern detection (MVC, Service Layer, Repository, etc.), smart project type detection
2. **QualityAnalyzer** (20pts) - Real ESLint API integration with error/warning counts, TypeScript analysis
3. **PerformanceAnalyzer** (15pts) - Bundle optimization, code splitting analysis
4. **TestingAnalyzer** (15pts) - Real coverage integration (c8, nyc, jest), test organization
5. **SecurityAnalyzer** (15pts) - npm audit CVE scanning, secrets management, error handling
6. **DeveloperExperienceAnalyzer** (10pts) - Enhanced tooling analysis, documentation quality
7. **CompletenessAnalyzer** (5pts) - Deep Context7/MCP compliance validation, production readiness

**Usage Examples:**
```bash
# Basic console scoring
context7 score

# Detailed analysis with recommendations
context7 score --detailed --recommendations

# Generate CI/CD compatible JSON
context7 score --format json --output results.json

# Create visual HTML reports
context7 score --format html --output report.html
```

**Development Notes:**
- Pure ESM package with real tool integration (Phase 1 + Quick Wins implemented)
- Enhanced with npm audit, ESLint API, and coverage tool integration
- Smart project type detection with 10+ supported project types
- Advanced architecture pattern recognition (16+ patterns detected)
- Graceful degradation with helpful setup guidance when tools unavailable
- Deep Context7/MCP compliance validation
- Multiple output formats with industry-grade accuracy