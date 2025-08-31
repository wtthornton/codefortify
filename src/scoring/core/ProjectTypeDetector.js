/**
 * Project Type Detector
 * 
 * Smart project type detection based on file structure and dependencies
 */

import { existsSync, readFileSync } from 'fs';
import path from 'path';

export class ProjectTypeDetector {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
  }

  detectProjectType() {
    try {
      // Check for package.json and analyze dependencies
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      
      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
          ...packageJson.peerDependencies
        };

        // MCP Server detection
        if (allDeps['@modelcontextprotocol/sdk'] || this.hasMCPServerFiles()) {
          return 'mcp-server';
        }

        // React detection
        if (allDeps.react || allDeps['react-dom'] || this.hasReactFiles()) {
          return 'react-webapp';
        }

        // Vue detection
        if (allDeps.vue || allDeps['@vue/cli-service'] || this.hasVueFiles()) {
          return 'vue-webapp';
        }

        // Node.js API detection
        if (allDeps.express || allDeps.fastify || allDeps.koa || 
            allDeps['@nestjs/core'] || this.hasAPIFiles()) {
          return 'node-api';
        }

        // CLI tool detection
        if (packageJson.bin || allDeps.commander || allDeps.yargs || this.hasCLIFiles()) {
          return 'cli-tool';
        }

        // TypeScript project
        if (allDeps.typescript || existsSync(path.join(this.projectRoot, 'tsconfig.json'))) {
          return 'typescript';
        }
      }

      // File-based detection fallbacks
      if (this.hasReactFiles()) return 'react-webapp';
      if (this.hasVueFiles()) return 'vue-webapp';
      if (this.hasAPIFiles()) return 'node-api';
      if (this.hasMCPServerFiles()) return 'mcp-server';
      if (this.hasCLIFiles()) return 'cli-tool';

      return 'javascript';

    } catch (error) {
      console.warn('Project type detection failed, defaulting to javascript');
      return 'javascript';
    }
  }

  hasMCPServerFiles() {
    const mcpIndicators = [
      'src/mcp-server.js',
      'mcp-server.js',
      'src/server/Context7MCPServer.js',
      'AGENTS.md'
    ];
    
    return mcpIndicators.some(file => 
      existsSync(path.join(this.projectRoot, file))
    );
  }

  hasReactFiles() {
    const reactIndicators = [
      'src/App.jsx',
      'src/App.tsx', 
      'src/components',
      'public/index.html'
    ];
    
    return reactIndicators.some(file => 
      existsSync(path.join(this.projectRoot, file))
    );
  }

  hasVueFiles() {
    const vueIndicators = [
      'src/App.vue',
      'src/main.js',
      'vue.config.js',
      'src/components'
    ];
    
    return vueIndicators.some(file => 
      existsSync(path.join(this.projectRoot, file))
    );
  }

  hasAPIFiles() {
    const apiIndicators = [
      'src/routes',
      'routes',
      'src/controllers',
      'controllers',
      'src/middleware',
      'middleware',
      'src/api',
      'api'
    ];
    
    return apiIndicators.some(file => 
      existsSync(path.join(this.projectRoot, file))
    );
  }

  hasCLIFiles() {
    const cliIndicators = [
      'bin',
      'cli.js',
      'src/cli',
      'cli'
    ];
    
    return cliIndicators.some(file => 
      existsSync(path.join(this.projectRoot, file))
    );
  }

  getProjectFrameworks(dependencies = {}, devDependencies = {}) {
    const allDeps = { ...dependencies, ...devDependencies };
    const frameworks = [];

    // Frontend frameworks
    if (allDeps.react) frameworks.push('React');
    if (allDeps.vue) frameworks.push('Vue');
    if (allDeps.svelte) frameworks.push('Svelte');
    if (allDeps.angular || allDeps['@angular/core']) frameworks.push('Angular');

    // Backend frameworks
    if (allDeps.express) frameworks.push('Express');
    if (allDeps.fastify) frameworks.push('Fastify');
    if (allDeps.koa) frameworks.push('Koa');
    if (allDeps['@nestjs/core']) frameworks.push('NestJS');

    // Build tools and meta-frameworks
    if (allDeps.next) frameworks.push('Next.js');
    if (allDeps.nuxt) frameworks.push('Nuxt.js');
    if (allDeps.gatsby) frameworks.push('Gatsby');
    if (allDeps.vite) frameworks.push('Vite');
    if (allDeps.webpack) frameworks.push('Webpack');

    // Testing frameworks
    if (allDeps.jest) frameworks.push('Jest');
    if (allDeps.vitest) frameworks.push('Vitest');
    if (allDeps.mocha) frameworks.push('Mocha');
    if (allDeps.cypress) frameworks.push('Cypress');

    return frameworks;
  }

  getProjectComplexityIndicators() {
    const indicators = {
      hasTypeScript: existsSync(path.join(this.projectRoot, 'tsconfig.json')),
      hasMonorepo: existsSync(path.join(this.projectRoot, 'lerna.json')) || 
                  existsSync(path.join(this.projectRoot, 'nx.json')),
      hasDocker: existsSync(path.join(this.projectRoot, 'Dockerfile')),
      hasCI: existsSync(path.join(this.projectRoot, '.github/workflows')) ||
             existsSync(path.join(this.projectRoot, '.gitlab-ci.yml')),
      hasTesting: existsSync(path.join(this.projectRoot, 'tests')) ||
                  existsSync(path.join(this.projectRoot, 'test')) ||
                  existsSync(path.join(this.projectRoot, '__tests__')),
      hasDatabase: this.hasDbFiles(),
      hasAPI: this.hasAPIFiles()
    };

    return indicators;
  }

  hasDbFiles() {
    const dbIndicators = [
      'prisma',
      'migrations',
      'src/models',
      'models',
      'src/database',
      'database'
    ];
    
    return dbIndicators.some(file => 
      existsSync(path.join(this.projectRoot, file))
    );
  }
}