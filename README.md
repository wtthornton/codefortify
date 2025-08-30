# Context7 MCP Integration Package

A comprehensive toolkit for integrating Context7 standards with Model Context Protocol (MCP) to enable seamless AI-assisted development across all your projects.

## 🎯 Overview

This package provides everything you need to add Context7 MCP integration to any project:

- **MCP Server** - Real-time AI assistant integration
- **Validation System** - Automated Context7 compliance checking  
- **Testing Infrastructure** - Comprehensive MCP testing tools
- **CLI Interface** - Easy setup and management
- **Pattern Templates** - Framework-specific code patterns
- **Multi-framework Support** - React, Vue, Node.js, and more

## 🚀 Quick Start

### Install Globally
```bash
npm install -g @yourname/context7-mcp
```

### Initialize New Project
```bash
# Create new project with Context7 integration
context7 init --type react-webapp

# Or add to existing project
cd your-existing-project
context7 add
```

### Instant AI Integration
```bash
# Validate Context7 compliance
context7 validate

# Test MCP server
context7 test-mcp

# Start MCP server for AI assistants
context7 serve
```

## 📋 Features

### 🤖 MCP Server
- **Real-time Context7 Access** - AI assistants can access project standards instantly
- **Code Validation Tools** - Automated Context7 compliance checking
- **Pattern Examples** - Framework-specific code patterns and scaffolding
- **Naming Convention Checks** - Validate file and component naming
- **Improvement Suggestions** - Context7-aware code improvement recommendations

### 🔍 Validation System
- **Project Structure Validation** - Check directory structure and required files
- **Agent OS Configuration** - Validate Agent OS and MCP configuration
- **Documentation Standards** - Ensure proper AI assistant documentation
- **Framework-specific Checks** - React, Vue, Node.js validation rules
- **Compliance Scoring** - Detailed compliance reports with scores

### 🧪 Testing Infrastructure
- **MCP Server Testing** - Comprehensive MCP functionality testing
- **Resource Access Testing** - Validate Context7 resource accessibility
- **Tool Execution Testing** - Test all MCP tools and capabilities
- **Connection Testing** - Verify AI assistant communication

### ⚙️ CLI Interface
- **Project Initialization** - Set up new projects with Context7 integration
- **Existing Project Integration** - Add Context7 to existing codebases
- **Validation Commands** - Check compliance and fix issues
- **Server Management** - Start, stop, and test MCP servers
- **Code Generation** - Generate Context7-compliant scaffolds

## 🏗️ Supported Project Types

### Frontend Frameworks
- **React** (`react-webapp`) - Full React 18+ support with hooks, TypeScript, Tailwind
- **Vue** (`vue-webapp`) - Vue 3 Composition API with TypeScript
- **Svelte** (`svelte-webapp`) - SvelteKit with modern tooling

### Backend Frameworks
- **Node.js API** (`node-api`) - Express, Fastify, Koa support
- **JavaScript/TypeScript** (`javascript`) - General JS/TS projects

### Coming Soon
- **Python** (`python-api`) - FastAPI, Django, Flask
- **Go** (`go-api`) - Gin, Echo, Fiber
- **Rust** (`rust-api`) - Axum, Warp, Actix

## 📚 CLI Commands

### Project Setup
```bash
# Initialize new project
context7 init [options]
  -t, --type <type>        Project type (react-webapp, vue-webapp, node-api)
  -f, --force              Force initialization even if files exist
  --no-mcp                 Skip MCP server setup
  --no-agent-os           Skip Agent OS setup

# Add to existing project  
context7 add [options]
  -t, --type <type>        Project type (auto-detect if not specified)
  --existing               Preserve existing configuration files
```

### Validation & Testing
```bash
# Validate project compliance
context7 validate [options]
  -s, --strict             Enable strict validation mode
  --fix                    Attempt to fix validation issues automatically

# Test MCP server functionality
context7 test-mcp [options]
  --server <path>          Path to MCP server file (default: src/mcp-server.js)
  --timeout <ms>           Request timeout in milliseconds
```

### Server Management
```bash
# Start MCP server
context7 serve [options]
  --config <path>          Path to configuration file
  --port <port>            Server port (for HTTP transport)

# Generate code scaffolds
context7 generate <type> [options]
  -n, --name <name>        Name for the generated code
  -f, --framework <framework>  Target framework
```

### Maintenance
```bash
# Update configuration and templates
context7 update [options]
  --templates              Update code templates only
  --config                 Update configuration only
```

## 🔧 Configuration

### Project Configuration (`context7.config.js`)
```javascript
export default {
  // Project settings
  projectName: 'my-project',
  projectType: 'react-webapp',
  
  // MCP Server settings
  mcp: {
    port: 3001,
    transport: 'stdio',
    capabilities: ['resources', 'tools', 'prompts'],
  },
  
  // Validation rules
  validation: {
    strictMode: true,
    requiredFiles: ['AGENTS.md', 'CLAUDE.md'],
    patterns: {
      components: 'PascalCase',
      hooks: 'camelCase',
      files: 'kebab-case',
    },
  },
  
  // Custom patterns
  patterns: {
    component: './custom-patterns/component.tsx',
  },
}
```

### Environment Variables
```bash
# MCP Server Configuration
PROJECT_ROOT=.
AGENT_OS_PATH=.agent-os
NODE_ENV=development

# Optional: Custom server settings
MCP_PORT=3001
MCP_TIMEOUT=30000
```

## 🔌 Programmatic API

### MCP Server
```javascript
import { Context7MCPServer } from '@yourname/context7-mcp';

const server = new Context7MCPServer({
  projectRoot: '.',
  projectType: 'react-webapp',
});

await server.start();
```

### Validation
```javascript
import { Context7Validator } from '@yourname/context7-mcp';

const validator = new Context7Validator({
  projectRoot: './my-project',
  strictMode: true,
});

const result = await validator.runValidation();
console.log(\`Compliance: \${result.report.successRate}%\`);
```

### Testing
```javascript
import { MCPConnectionTester } from '@yourname/context7-mcp';

const tester = new MCPConnectionTester({
  projectRoot: './my-project',
  serverPath: 'src/mcp-server.js',
});

const result = await tester.runTests();
console.log(\`Tests passed: \${result.report.passed}/\${result.report.total}\`);
```

## 🎨 Code Patterns

The package includes Context7-compliant patterns for:

### React Components
- **Functional Components** with TypeScript and React.FC
- **Custom Hooks** with proper error handling and caching
- **Service Classes** with validation and error handling
- **Test Patterns** with React Testing Library

### Vue Components
- **Composition API** with TypeScript
- **Composables** with proper reactivity
- **Service Layer** with validation

### Node.js APIs
- **Express Routes** with validation and error handling
- **Middleware** with proper async handling
- **Service Classes** with dependency injection

## 🤝 Integration with AI Assistants

### Claude Code
```bash
# Claude Code automatically detects Context7 MCP
# Configure in CLAUDE.md for project-specific guidance
```

### Cursor
```bash
# Cursor uses .cursorrules and Agent OS configuration
# MCP server provides real-time context
```

### Other AI Assistants
```bash
# Any MCP-compatible AI assistant can connect
context7 serve  # Starts MCP server on stdio transport
```

## 📊 Benefits

### For Development Teams
- **Consistent Standards** - Same Context7 patterns across all projects
- **Faster Onboarding** - New team members get AI-assisted guidance
- **Quality Assurance** - Automated compliance checking
- **Documentation Sync** - Standards always up-to-date and accessible

### For AI Assistants
- **Real-time Standards Access** - No guessing about project patterns
- **Automated Code Validation** - Instant Context7 compliance checking
- **Pattern Examples** - Access to established code patterns
- **Smart Suggestions** - Context-aware improvement recommendations

## 🛣️ Roadmap

### v1.1
- [ ] Auto-fix validation issues
- [ ] More code generation templates
- [ ] VS Code extension
- [ ] GitHub Actions integration

### v1.2
- [ ] Python/Django support
- [ ] Go/Gin support
- [ ] Advanced pattern customization
- [ ] Team collaboration features

### v2.0
- [ ] Cloud-hosted MCP servers
- [ ] Enterprise features
- [ ] Advanced analytics
- [ ] Plugin ecosystem

## 🐛 Troubleshooting

### Common Issues

**MCP Server won't start**
```bash
# Check if dependencies are installed
npm install @modelcontextprotocol/sdk

# Validate project structure
context7 validate

# Test with verbose logging
context7 serve --verbose
```

**Validation fails**
```bash
# Run in strict mode for detailed output
context7 validate --strict

# Check required files exist
ls -la .agent-os/
ls -la AGENTS.md CLAUDE.md
```

**AI Assistant not connecting**
```bash
# Test MCP server directly
context7 test-mcp

# Check server logs
context7 serve --verbose

# Verify transport configuration
grep -r "transport" .agent-os/
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/context7-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/context7-mcp/discussions)
- **Documentation**: [Full Documentation](https://context7-mcp.dev)

---

**Made with ❤️ for AI-assisted development**