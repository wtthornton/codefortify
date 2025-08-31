# Context7 MCP Examples

This directory contains example projects showing how to use the Context7 MCP Package in different scenarios.

## Quick Start Examples

### React Web App
```bash
# Initialize new React project with Context7
mkdir my-react-app
cd my-react-app
context7 init --type react-webapp

# Install dependencies and start development
npm install
npm run dev

# Test MCP integration
npm run mcp:test
npm run context7:score
```

### Vue Web App  
```bash
# Initialize new Vue project with Context7
mkdir my-vue-app
cd my-vue-app
context7 init --type vue-webapp

npm install
npm run dev
npm run mcp:test
```

### Node.js API
```bash
# Initialize new Node API with Context7
mkdir my-api
cd my-api
context7 init --type node-api

npm install
npm start
npm run context7:validate
```

### Add to Existing Project
```bash
# Add Context7 to any existing project
cd your-existing-project
context7 add  # Auto-detects project type

# Or specify project type
context7 add --type react-webapp

npm run context7:validate
npm run mcp:test
```

## Usage Examples

### Quality Scoring
```bash
# Basic quality analysis
context7 score

# Detailed analysis with recommendations  
context7 score --detailed --recommendations

# Generate HTML report
context7 score --format html --output quality-report.html --open

# JSON output for CI/CD
context7 score --format json --output results.json
```

### MCP Server Integration
```bash
# Test MCP server functionality
context7 test-mcp

# Start MCP server for AI assistants
context7 serve

# Custom server configuration
context7 serve --config custom-config.json
```

### Validation and Compliance
```bash
# Check Context7 compliance
context7 validate

# Strict validation mode
context7 validate --strict

# Auto-fix issues (when available)
context7 validate --fix
```

## Integration Patterns

### With Claude Code
Add to your `CLAUDE.md`:
```markdown
# CLAUDE.md

This project uses Context7 MCP for AI assistance.

## Commands
- `npm run context7:score` - Analyze project quality
- `npm run mcp:test` - Test MCP server
- `npm run context7:validate` - Check compliance
```

### With CI/CD
Add to GitHub Actions workflow:
```yaml
- name: Context7 Quality Check
  run: |
    npm run context7:score --format json --output results.json
    npm run context7:validate --strict
```

### With Development Workflow
Add to `package.json` scripts:
```json
{
  "scripts": {
    "dev": "vite & context7 serve",
    "quality": "npm run context7:score --detailed",
    "precommit": "npm run context7:validate && npm run lint"
  }
}
```

## Available Templates

- `react-webapp` - React with TypeScript, Vite, Tailwind CSS
- `vue-webapp` - Vue 3 with Composition API and TypeScript  
- `node-api` - Express.js API with TypeScript
- `javascript` - General JavaScript/TypeScript project

## Next Steps

1. Choose an example above based on your project type
2. Initialize or add Context7 to your project
3. Run quality analysis to understand current state
4. Start MCP server for AI assistant integration
5. Use validation to maintain Context7 compliance

For more detailed documentation, see the main [README.md](../README.md).