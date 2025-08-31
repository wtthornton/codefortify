/**
 * DeveloperExperienceAnalyzer - Analyzes tooling and workflow setup
 * 
 * Evaluates:
 * - Development tooling and automation (4pts)
 * - Documentation quality and completeness (3pts)
 * - Package.json scripts and workflow (2pts)
 * - Version control and collaboration setup (1pt)
 * Total: 10pts
 */

import { BaseAnalyzer } from './BaseAnalyzer.js';

export class DeveloperExperienceAnalyzer extends BaseAnalyzer {
  constructor(config) {
    super(config);
    this.categoryName = 'Developer Experience';
    this.description = 'Development tooling, documentation, scripts, and workflow setup';
  }

  async runAnalysis() {
    this.results.score = 0;
    this.results.issues = [];
    this.results.suggestions = [];
    
    await this.analyzeDevelopmentTooling(); // 4pts
    await this.analyzeDocumentationQuality(); // 3pts
    await this.analyzePackageScripts(); // 2pts
    await this.analyzeVersionControlSetup(); // 1pt
  }

  async analyzeDevelopmentTooling() {
    let _score = 0;
    const _maxScore = 4;
    
    const packageJson = await this.readPackageJson();
    if (!packageJson) {
      this.addIssue('No package.json found', 'Cannot analyze development dependencies');
      return;
    }
    
    const devDeps = packageJson.devDependencies || {};
    const deps = packageJson.dependencies || {};
    const allDeps = { ...deps, ...devDeps };
    
    // Check for code quality tools
    const lintingTools = ['eslint', '@eslint/js', 'tslint', 'jshint'];
    const formattingTools = ['prettier', 'standardjs', 'beautify'];
    const hasLinting = lintingTools.some(tool => allDeps[tool]);
    const hasFormatting = formattingTools.some(tool => allDeps[tool]);
    
    if (hasLinting) {
      _score += 1;
      this.addScore(1, 1, 'Code linting tools configured');
    } else {
      this.addIssue('No linting tools found', 'Add ESLint or similar for code quality');
    }
    
    if (hasFormatting) {
      _score += 1;
      this.addScore(1, 1, 'Code formatting tools configured');
    } else {
      this.addIssue('No formatting tools found', 'Add Prettier for consistent code formatting');
    }
    
    // Check for build tools and bundlers
    const buildTools = [
      'webpack', 'rollup', 'vite', 'parcel', 'esbuild', 'swc',
      'babel', '@babel/core', 'typescript', 'ts-node'
    ];
    const hasBuildTools = buildTools.some(tool => allDeps[tool]);
    
    if (hasBuildTools) {
      _score += 1;
      this.addScore(1, 1, 'Build tooling detected');
    }
    
    // Check for development convenience tools
    const devTools = [
      'nodemon', 'concurrently', 'cross-env', 'dotenv',
      'husky', 'lint-staged', 'commitizen', 'conventional-commits'
    ];
    const hasDevTools = devTools.some(tool => allDeps[tool]);
    
    if (hasDevTools) {
      _score += 1;
      this.addScore(1, 1, 'Development convenience tools found');
    } else {
      this.addIssue('Limited development tooling', 'Consider adding nodemon, husky, or other dev tools');
    }
    
    this.setDetail('hasLinting', hasLinting);
    this.setDetail('hasFormatting', hasFormatting);
    this.setDetail('hasBuildTools', hasBuildTools);
    this.setDetail('hasDevTools', hasDevTools);
  }

  async analyzeDocumentationQuality() {
    let _score = 0;
    const _maxScore = 3;
    
    // Check for README
    let readmeScore = 0;
    const hasReadme = await this.fileExists('README.md');
    
    if (hasReadme) {
      try {
        const readmeContent = await this.readFile('README.md');
        const readmeLength = readmeContent.length;
        
        if (readmeLength > 2000) {
          readmeScore = 2;
          this.addScore(2, 2, 'Comprehensive README documentation');
        } else if (readmeLength > 500) {
          readmeScore = 1;
          this.addScore(1, 2, 'Basic README documentation');
        } else {
          readmeScore = 0.5;
          this.addScore(0.5, 2, 'Minimal README found');
          this.addIssue('README is very short', 'Expand README with installation, usage, and examples');
        }
        
        // Check for common README sections
        const commonSections = [
          'install', 'usage', 'example', 'api', 'contribut', 
          'license', 'getting started', 'requirements'
        ];
        const sectionCount = commonSections.filter(section => 
          readmeContent.toLowerCase().includes(section)
        ).length;
        
        if (sectionCount >= 4) {
          readmeScore += 0.5;
          this.addScore(0.5, 0.5, 'README has good section coverage');
        }
        
      } catch (error) {
        this.addIssue('Could not read README', 'Ensure README.md is accessible');
      }
    } else {
      this.addIssue('No README.md found', 'Create comprehensive project documentation');
    }
    
    _score += Math.min(readmeScore, 2);
    
    // Check for additional documentation
    const docFiles = [
      'CONTRIBUTING.md', 'CHANGELOG.md', 'API.md', 'USAGE.md',
      'docs/', 'documentation/', '.github/'
    ];
    
    let additionalDocs = 0;
    for (const docPath of docFiles) {
      if (await this.fileExists(docPath)) {
        additionalDocs++;
      }
    }
    
    if (additionalDocs > 0) {
      const docScore = Math.min(additionalDocs / 3, 1);
      _score += docScore;
      this.addScore(docScore, 1, `Additional documentation found (${additionalDocs} items)`);
    } else {
      this.addIssue('No additional documentation', 'Consider adding CONTRIBUTING.md or API docs');
    }
    
    this.setDetail('readmeLength', hasReadme ? 'exists' : 'missing');
    this.setDetail('additionalDocs', additionalDocs);
  }

  async analyzePackageScripts() {
    let _score = 0;
    const _maxScore = 2;
    
    const packageJson = await this.readPackageJson();
    if (!packageJson || !packageJson.scripts) {
      this.addIssue('No package.json scripts found', 'Add useful npm scripts for development');
      return;
    }
    
    const scripts = packageJson.scripts;
    const scriptNames = Object.keys(scripts);
    
    // Check for essential scripts
    const essentialScripts = ['test', 'start', 'build'];
    const hasEssentialScripts = essentialScripts.filter(script => scripts[script]);
    
    if (hasEssentialScripts.length >= 3) {
      _score += 1;
      this.addScore(1, 1, 'Essential scripts present (test, start, build)');
    } else if (hasEssentialScripts.length >= 2) {
      _score += 0.5;
      this.addScore(0.5, 1, `Some essential scripts present (${hasEssentialScripts.join(', ')})`);
    } else {
      this.addIssue('Missing essential scripts', 'Add test, start, and build scripts');
    }
    
    // Check for development convenience scripts
    const devScripts = [
      'dev', 'develop', 'watch', 'serve',
      'lint', 'format', 'type-check', 'typecheck',
      'clean', 'prebuild', 'postbuild'
    ];
    const hasDevScripts = devScripts.filter(script => scripts[script]);
    
    if (hasDevScripts.length >= 3) {
      _score += 1;
      this.addScore(1, 1, `Good development script coverage (${hasDevScripts.length} scripts)`);
    } else if (hasDevScripts.length >= 1) {
      _score += 0.5;
      this.addScore(0.5, 1, `Some development scripts present (${hasDevScripts.join(', ')})`);
    } else {
      this.addIssue('Limited development scripts', 'Add dev, lint, format scripts for better workflow');
    }
    
    this.setDetail('scriptCount', scriptNames.length);
    this.setDetail('essentialScripts', hasEssentialScripts);
    this.setDetail('devScripts', hasDevScripts);
  }

  async analyzeVersionControlSetup() {
    let _score = 0;
    const _maxScore = 1;
    
    // Check for .gitignore
    const hasGitignore = await this.fileExists('.gitignore');
    if (hasGitignore) {
      try {
        const gitignoreContent = await this.readFile('.gitignore');
        const commonEntries = [
          'node_modules', '.env', 'dist', 'build', 
          '.DS_Store', '*.log', 'coverage'
        ];
        
        const entryCount = commonEntries.filter(entry => 
          gitignoreContent.includes(entry)
        ).length;
        
        if (entryCount >= 4) {
          _score += 0.5;
          this.addScore(0.5, 0.5, 'Comprehensive .gitignore configuration');
        } else if (entryCount >= 2) {
          _score += 0.25;
          this.addScore(0.25, 0.5, 'Basic .gitignore configuration');
        } else {
          this.addIssue('Incomplete .gitignore', 'Add common ignore patterns (node_modules, .env, etc.)');
        }
      } catch (error) {
        this.addIssue('Could not read .gitignore', 'Ensure .gitignore is properly configured');
      }
    } else {
      this.addIssue('No .gitignore found', 'Create .gitignore to exclude unnecessary files');
    }
    
    // Check for Git hooks or workflow files
    const workflowFiles = [
      '.github/workflows/', '.github/PULL_REQUEST_TEMPLATE.md',
      '.github/ISSUE_TEMPLATE/', '.husky/', 'pre-commit',
      '.gitlab-ci.yml', 'azure-pipelines.yml', 'Jenkinsfile'
    ];
    
    let workflowSetup = 0;
    for (const workflowPath of workflowFiles) {
      if (await this.fileExists(workflowPath)) {
        workflowSetup++;
      }
    }
    
    if (workflowSetup > 0) {
      _score += 0.5;
      this.addScore(0.5, 0.5, `CI/CD or Git workflow setup detected (${workflowSetup} items)`);
    } else {
      this.addIssue('No workflow automation detected', 'Consider adding GitHub Actions or Git hooks');
    }
    
    this.setDetail('hasGitignore', hasGitignore);
    this.setDetail('workflowSetup', workflowSetup);
  }
}