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

        // Next.js detection (check before React since Next includes React)
        if (allDeps.next || this.hasNextFiles()) {
          return 'next-app';
        }

        // React Native detection
        if (allDeps['react-native'] || allDeps['@react-native-community/cli'] || this.hasReactNativeFiles()) {
          return 'mobile-react-native';
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

        // Flutter detection
        if (this.hasFlutterFiles()) {
          return 'mobile-flutter';
        }

        // Electron detection
        if (allDeps.electron || this.hasElectronFiles()) {
          return 'desktop-electron';
        }

        // AI/ML detection
        if (allDeps.tensorflow || allDeps['@tensorflow/tfjs'] || allDeps.pytorch || this.hasAIMLFiles()) {
          return 'ai-ml';
        }

        // Blockchain/DApp detection
        if (allDeps.web3 || allDeps.ethers || allDeps['@solana/web3.js'] || this.hasBlockchainFiles()) {
          return 'blockchain-dapp';
        }

        // Unity game detection
        if (this.hasUnityFiles()) {
          return 'game-unity';
        }

        // Serverless detection
        if (allDeps.serverless || allDeps['aws-lambda'] || this.hasServerlessFiles()) {
          return 'serverless';
        }

        // Microservices detection
        if (this.hasMicroservicesFiles()) {
          return 'microservices';
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

      // Python project detection
      if (this.hasPythonFiles()) {
        return 'python';
      }

      // File-based detection fallbacks
      if (this.hasNextFiles()) {return 'next-app';}
      if (this.hasReactNativeFiles()) {return 'mobile-react-native';}
      if (this.hasFlutterFiles()) {return 'mobile-flutter';}
      if (this.hasElectronFiles()) {return 'desktop-electron';}
      if (this.hasUnityFiles()) {return 'game-unity';}
      if (this.hasBlockchainFiles()) {return 'blockchain-dapp';}
      if (this.hasAIMLFiles()) {return 'ai-ml';}
      if (this.hasServerlessFiles()) {return 'serverless';}
      if (this.hasMicroservicesFiles()) {return 'microservices';}
      if (this.hasReactFiles()) {return 'react-webapp';}
      if (this.hasVueFiles()) {return 'vue-webapp';}
      if (this.hasAPIFiles()) {return 'node-api';}
      if (this.hasMCPServerFiles()) {return 'mcp-server';}
      if (this.hasCLIFiles()) {return 'cli-tool';};

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
    if (allDeps.react) {frameworks.push('React');}
    if (allDeps.vue) {frameworks.push('Vue');}
    if (allDeps.svelte) {frameworks.push('Svelte');}
    if (allDeps.angular || allDeps['@angular/core']) {frameworks.push('Angular');}

    // Backend frameworks
    if (allDeps.express) {frameworks.push('Express');}
    if (allDeps.fastify) {frameworks.push('Fastify');}
    if (allDeps.koa) {frameworks.push('Koa');}
    if (allDeps['@nestjs/core']) {frameworks.push('NestJS');}

    // Build tools and meta-frameworks
    if (allDeps.next) {frameworks.push('Next.js');}
    if (allDeps.nuxt) {frameworks.push('Nuxt.js');}
    if (allDeps.gatsby) {frameworks.push('Gatsby');}
    if (allDeps.vite) {frameworks.push('Vite');}
    if (allDeps.webpack) {frameworks.push('Webpack');}

    // Testing frameworks
    if (allDeps.jest) {frameworks.push('Jest');}
    if (allDeps.vitest) {frameworks.push('Vitest');}
    if (allDeps.mocha) {frameworks.push('Mocha');}
    if (allDeps.cypress) {frameworks.push('Cypress');}

    // Mobile frameworks
    if (allDeps['react-native']) {frameworks.push('React Native');}
    if (allDeps.flutter) {frameworks.push('Flutter');}

    // Desktop frameworks
    if (allDeps.electron) {frameworks.push('Electron');}
    if (allDeps.tauri) {frameworks.push('Tauri');}

    // Game frameworks
    if (allDeps.unity) {frameworks.push('Unity');}
    if (allDeps.godot) {frameworks.push('Godot');}

    // Blockchain frameworks
    if (allDeps.web3) {frameworks.push('Web3');}
    if (allDeps.ethers) {frameworks.push('Ethers');}

    // AI/ML frameworks
    if (allDeps.tensorflow) {frameworks.push('TensorFlow');}
    if (allDeps.pytorch) {frameworks.push('PyTorch');}

    // Serverless frameworks
    if (allDeps.serverless) {frameworks.push('Serverless Framework');}
    if (allDeps['aws-lambda']) {frameworks.push('AWS Lambda');}

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

  hasPythonFiles() {
    const pythonIndicators = [
      'pyproject.toml',
      'setup.py',
      'requirements.txt',
      'poetry.lock',
      'Pipfile',
      'main.py',
      'app.py',
      '__init__.py'
    ];

    return pythonIndicators.some(file =>
      existsSync(path.join(this.projectRoot, file))
    );
  }

  hasNextFiles() {
    const nextIndicators = [
      'next.config.js',
      'next.config.ts',
      'pages',
      'app', // Next.js 13+ app directory
      '.next'
    ];

    return nextIndicators.some(file =>
      existsSync(path.join(this.projectRoot, file))
    );
  }

  hasReactNativeFiles() {
    const reactNativeIndicators = [
      'metro.config.js',
      'react-native.config.js',
      'android',
      'ios',
      'App.tsx',
      'App.jsx',
      'index.js', // RN entry point
      '__tests__' // Common RN test directory
    ];

    // Check for React Native specific files
    const hasRNFiles = reactNativeIndicators.some(file =>
      existsSync(path.join(this.projectRoot, file))
    );

    // Also check for RN-specific imports in main files
    if (existsSync(path.join(this.projectRoot, 'App.js'))) {
      try {
        const content = require('fs').readFileSync(path.join(this.projectRoot, 'App.js'), 'utf8');
        return content.includes('react-native') || hasRNFiles;
      } catch {
        return hasRNFiles;
      }
    }

    return hasRNFiles;
  }

  hasFlutterFiles() {
    const flutterIndicators = [
      'pubspec.yaml',
      'lib',
      'android',
      'ios',
      'test',
      'analysis_options.yaml'
    ];

    return flutterIndicators.some(file =>
      existsSync(path.join(this.projectRoot, file))
    );
  }

  hasElectronFiles() {
    const electronIndicators = [
      'main.js', // Electron main process
      'electron.js',
      'src/main', // Common Electron structure
      'app/main.js',
      'build/electron.js'
    ];

    return electronIndicators.some(file =>
      existsSync(path.join(this.projectRoot, file))
    );
  }

  hasUnityFiles() {
    const unityIndicators = [
      'Assets',
      'ProjectSettings',
      'Packages/manifest.json',
      'UserSettings',
      '.unity'
    ];

    return unityIndicators.some(file =>
      existsSync(path.join(this.projectRoot, file))
    );
  }

  hasBlockchainFiles() {
    const blockchainIndicators = [
      'contracts',
      'hardhat.config.js',
      'truffle-config.js',
      'foundry.toml',
      'Anchor.toml', // Solana
      'move.toml' // Move language
    ];

    return blockchainIndicators.some(file =>
      existsSync(path.join(this.projectRoot, file))
    );
  }

  hasAIMLFiles() {
    const aimlIndicators = [
      'requirements.txt', // Check if it contains ML packages
      'conda.yml',
      'environment.yml',
      'models',
      'notebooks',
      'data',
      'train.py',
      'model.py',
      'inference.py'
    ];

    // Basic file structure check
    const hasAIFiles = aimlIndicators.some(file =>
      existsSync(path.join(this.projectRoot, file))
    );

    // Check requirements.txt for ML packages
    const reqFile = path.join(this.projectRoot, 'requirements.txt');
    if (existsSync(reqFile)) {
      try {
        const content = require('fs').readFileSync(reqFile, 'utf8');
        const mlPackages = ['tensorflow', 'pytorch', 'torch', 'scikit-learn', 'pandas', 'numpy', 'opencv', 'keras', 'transformers'];
        const hasMLDeps = mlPackages.some(pkg => content.toLowerCase().includes(pkg));
        return hasMLDeps || hasAIFiles;
      } catch {
        return hasAIFiles;
      }
    }

    return hasAIFiles;
  }

  hasServerlessFiles() {
    const serverlessIndicators = [
      'serverless.yml',
      'serverless.yaml',
      'sam.yaml',
      'template.yaml', // AWS SAM
      'functions', // Serverless functions directory
      'lambda',
      'netlify.toml',
      'vercel.json'
    ];

    return serverlessIndicators.some(file =>
      existsSync(path.join(this.projectRoot, file))
    );
  }

  hasMicroservicesFiles() {
    const microservicesIndicators = [
      'docker-compose.yml',
      'docker-compose.yaml',
      'k8s', // Kubernetes configs
      'kubernetes',
      'helm', // Helm charts
      'services', // Multiple service directories
      'apps', // Multiple app directories
      'Dockerfile' // Containerization
    ];

    const hasDockerCompose = existsSync(path.join(this.projectRoot, 'docker-compose.yml')) ||
                            existsSync(path.join(this.projectRoot, 'docker-compose.yaml'));

    const hasMultipleServices = existsSync(path.join(this.projectRoot, 'services')) &&
                               require('fs').readdirSync(path.join(this.projectRoot, 'services')).length > 1;

    return hasDockerCompose || hasMultipleServices || microservicesIndicators.some(file =>
      existsSync(path.join(this.projectRoot, file))
    );
  }
}