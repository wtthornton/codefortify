# CLAUDE.md

## CodeFortify
AI-powered code enhancement with autonomous improvement through specialized agents. Real-time IDE integration and comprehensive quality scoring.

**Version**: 1.1.0 | **Package**: @wtthornton/codefortify | **Status**: ACTIVE

### Key Metrics
- **Token Usage**: 78.7% reduction (15k → 3.2k tokens)
- **ESLint Errors**: 93.6% reduction (47 → 3)
- **Test Coverage**: 106% increase (42% → 87%)
- **Dev Speed**: 60% faster feature implementation

## Development Commands

```bash
# NEW: Fast Agent Initialization (USE THIS FIRST!)
codefortify agent-init --quick                          # 30-second project context
codefortify agent-init --detailed                       # Comprehensive overview

# CodeFortify CLI
codefortify enhance [file] --target 95 --iterations 5    # Autonomous enhancement
codefortify score --detailed --recommendations           # Quality analysis
codefortify validate                                     # Compliance check
codefortify test-mcp                                    # MCP server test

# Development
npm run dev          # Start MCP server
npm run test         # Run tests with Vitest
npm run coverage     # Generate coverage reports
npm run lint         # ESLint checks
npm run audit        # Security scan
```

## Project Architecture

### Core Components
- **Continuous Enhancement** (`src/core/`) - Autonomous improvement orchestrator
- **AI Agents** (`src/agents/`) - Specialized analyzers (Security, Quality, Structure)
- **Pattern Learning** (`src/learning/`) - 94.7% acceptance rate learning system
- **Real-time Monitoring** (`src/monitoring/`) - Quality monitoring and suggestions
- **MCP Server** (`src/server/`) - Main server with continuous enhancement
- **CLI** (`bin/codefortify.js`) - Revolutionary enhancement commands
- **Scoring** (`src/scoring/`) - 7-category analysis with real tool integration

### Project Types
- `react-webapp`, `vue-webapp`, `node-api`, `javascript`

## Quality Scoring (7 Categories, 100pts)
- **Code Structure** (20pts) - Architecture patterns, file organization
- **Code Quality** (20pts) - ESLint API, TypeScript integration  
- **Performance** (15pts) - Bundle optimization, code splitting
- **Testing** (15pts) - Real coverage metrics via c8/nyc/jest
- **Security** (15pts) - npm audit, vulnerability scanning
- **Developer Experience** (10pts) - Tooling, documentation
- **Completeness** (5pts) - Production readiness

### Usage Examples
```bash
codefortify score                                        # Basic scoring
codefortify score --detailed --recommendations          # Detailed analysis
codefortify score --format html --output report.html    # HTML report
```

## Self-Improvement Methodology

### Always Use CodeFortify First
```bash
# FIRST: Agent initialization (NEW AGENTS START HERE!)
npx codefortify agent-init --quick                      # 30-second context

# Before changes
npx codefortify score --verbose

# During development  
npx codefortify enhance [file] --target 95 --iterations 3

# After changes
npx codefortify score --verbose
```

### Enhancement Cycle
1. **Analyze** - `codefortify score` to identify issues
2. **Fix** - Address critical issues systematically  
3. **Enhance** - Use autonomous enhancement
4. **Validate** - Verify improvements
5. **Learn** - Update patterns
6. **Repeat** - Until A grade (90+)

### Quality Gates
- **Target**: A grade (90+/100)
- **Current**: C grade (76/100) 
- **Critical**: 0 ESLint errors, 80%+ coverage, 80%+ JSDoc

## Dependencies
- **Core**: @modelcontextprotocol/sdk, commander, inquirer
- **Testing**: vitest, eslint, prettier, c8
- **Analysis**: webpack-bundle-analyzer, npm audit integration

---

## Important Instructions
Do what has been asked; nothing more, nothing less.
NEVER create files unless absolutely necessary.
ALWAYS prefer editing existing files.
NEVER proactively create documentation files.

**CRITICAL**: Always use CodeFortify to enhance yourself and achieve A grade quality.