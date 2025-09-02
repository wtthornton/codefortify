# CodeFortify Development Guidelines

## 🎯 Core Mission
Help AI assistants write **faster**, **cheaper**, **correct** code in one pass.

## Critical Bug Patterns (MISSION CRITICAL)

### 1. Retry Messages = Bugs
- **Rule**: Retry messages indicate error handling bugs
- **Impact**: Slows AI assistants, increases costs
- **Action**: Fix root cause, don't accept retries as normal

### 2. ESLint Errors Are Critical
- **Rule**: Fix ESLint errors immediately (especially `no-unused-vars`)
- **Impact**: Forces AI assistants to iterate multiple times
- **Action**: Systematic fixing starting with most common errors

### 3. Test-First Development
- **Rule**: Write tests BEFORE implementation
- **Impact**: Prevents costly debugging iterations
- **Limit**: Never write >50 lines without test coverage

## Quality Standards

### Enhanced Scoring (Rigorous)
- **Target**: A+ grade (98+/100)
- **ESLint**: 0 errors, 0 warnings = 4/4 points
- **Test Coverage**: 95%+ = A+ grade, 90%+ = A grade
- **JSDoc**: All public methods documented (0% = critical)

### Current Status & Blockers
- **Score**: C grade (76/100) - Need A+
- **ESLint**: 196 errors (critical)
- **Coverage**: 21% (need 95%+)
- **JSDoc**: 0% documented
- **Incomplete**: 108 items

## Self-Improvement Protocol

### Always Use CodeFortify First
```bash
# Before any changes
npx codefortify score --verbose

# Record improvements  
node record-improvement-session.js
```

### Learning System Integration
- Record all ESLint fixes and solutions
- Track JSDoc improvements
- Build institutional knowledge
- Prevent recurring issues

## Key Rules

### Project Naming
- Use "CodeFortify" (not context7-mcp)
- `CodeFortifyError`, `CodeFortifyMCPServer`

### Error Handling
- Graceful degradation with fallbacks
- Only retry network calls, not file operations
- Use try-catch with meaningful defaults

### Code Quality
- JSDoc all public methods (@param, @returns, @throws, @example)
- TypeScript support with tsconfig.json
- Performance optimization patterns

## Quick Commands
```bash
npx codefortify score --verbose  # Analysis
npm run lint                     # ESLint fixes
npm run test                     # Run tests
npm run test:coverage           # Coverage check
node record-improvement-session.js  # Record progress
```

## Priority Order
1. **Critical**: Fix retries & ESLint errors
2. **High**: Improve coverage & JSDoc, record in learning system
3. **Medium**: Complete incomplete items
4. **Low**: Add optimization patterns

*Update this document when new patterns discovered.*
