# AGENTS.md

This file provides context and instructions to help AI coding agents work effectively on the Context7 MCP integration package.

## Project Overview

This is a Node.js package that provides Context7 MCP (Model Context Protocol) integration for AI-assisted development. The package enables AI assistants to access project standards, patterns, and configurations in real-time through a standardized MCP server interface.

**Key Components:**
- MCP Server for real-time Context7 integration
- CLI tool for project setup and management (`context7` command)
- Project quality scoring system with 7-category evaluation
- Validation system for Context7 compliance
- Comprehensive testing infrastructure with Vitest
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
npx context7 score

# Code quality checks
npm run lint
npm run format
npm run type-check
```

**Package Structure:**
- `src/server/` - MCP server implementation
- `src/scoring/` - Project quality scoring system
  - `analyzers/` - 7 specialized quality analyzers
- `src/validation/` - Context7 compliance validation
- `src/testing/` - MCP connection testing
- `tests/` - Comprehensive test suite with Vitest
- `bin/context7.js` - CLI entry point with scoring integration
- `templates/` - Configuration templates

## Testing Instructions

**Comprehensive test suite** using Vitest with unit and integration tests:

1. **Full Test Suite:**
   ```bash
   npm run test           # Run all tests with coverage
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
- `tests/integration/` - MCP protocol and server integration tests
- `tests/cli/` - CLI command functionality tests
- `tests/fixtures/` - Test data and mock projects

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
npm run lint         # ESLint code quality
npm run format       # Prettier formatting
npm run type-check   # TypeScript checking
npm run score        # Project quality analysis
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
- `src/scoring/ProjectScorer.js` - Scoring system orchestrator
- `src/scoring/analyzers/` - Quality analyzers (7 classes)
- `bin/context7.js` - CLI functionality with scoring integration
- `tests/` - Test suite coverage
- `package.json` - Dependencies and scripts
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