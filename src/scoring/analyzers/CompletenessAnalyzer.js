/**
 * CompletenessAnalyzer - Analyzes project completeness and production readiness
 * 
 * Evaluates:
 * - TODO and placeholder code completion (2pts)
 * - Production configuration and deployment readiness (2pts)
 * - Project metadata and licensing (1pt)
 * Total: 5pts
 */

import { BaseAnalyzer } from './BaseAnalyzer.js';

export class CompletenessAnalyzer extends BaseAnalyzer {
  constructor(config) {
    super(config);
    this.categoryName = 'Completeness & Production Readiness';
    this.description = 'TODO completion, production configuration, and project metadata';
  }

  async runAnalysis() {
    this.results.score = 0;
    this.results.issues = [];
    this.results.suggestions = [];
    
    await this.analyzeTodoAndPlaceholders(); // 2pts
    await this.analyzeProductionReadiness(); // 2pts
    await this.analyzeProjectMetadata(); // 1pt
  }

  async analyzeTodoAndPlaceholders() {
    let score = 0;
    const maxScore = 2;
    
    const files = await this.getAllFiles('', ['.js', '.ts', '.jsx', '.tsx', '.md', '.json']);
    let todoCount = 0;
    let placeholderCount = 0;
    let fixmeCount = 0;
    
    for (const file of files) {
      try {
        const content = await this.readFile(file);
        
        // Count TODOs, FIXMEs, and placeholder patterns
        const todoMatches = content.match(/\/\/\s*TODO|\/\*\s*TODO|\btodo\b/gi);
        const fixmeMatches = content.match(/\/\/\s*FIXME|\/\*\s*FIXME|\bfixme\b/gi);
        const placeholderMatches = content.match(/placeholder|xxx|changeme|replace.*this|implement.*here/gi);
        
        if (todoMatches) todoCount += todoMatches.length;
        if (fixmeMatches) fixmeCount += fixmeMatches.length;
        if (placeholderMatches) placeholderCount += placeholderMatches.length;
        
      } catch (error) {
        // Skip files that can't be read
      }
    }
    
    const totalIncomplete = todoCount + fixmeCount + placeholderCount;
    
    if (totalIncomplete === 0) {
      score += 2;
      this.addScore(2, 2, 'No TODO or placeholder code found');
    } else if (totalIncomplete <= 5) {
      score += 1.5;
      this.addScore(1.5, 2, `Few incomplete items (${totalIncomplete})`);
      this.addIssue('Some TODO items remain', 'Complete remaining TODO and FIXME items');
    } else if (totalIncomplete <= 15) {
      score += 1;
      this.addScore(1, 2, `Moderate incomplete items (${totalIncomplete})`);
      this.addIssue('Many TODO items found', 'Address TODO, FIXME, and placeholder code');
    } else {
      score += 0.5;
      this.addScore(0.5, 2, `Many incomplete items (${totalIncomplete})`);
      this.addIssue('High number of incomplete items', 'Project appears unfinished - complete TODO and placeholder code');
    }
    
    this.setDetail('todoCount', todoCount);
    this.setDetail('fixmeCount', fixmeCount);
    this.setDetail('placeholderCount', placeholderCount);
    this.setDetail('totalIncomplete', totalIncomplete);
  }

  async analyzeProductionReadiness() {
    let score = 0;
    const maxScore = 2;
    
    const packageJson = await this.readPackageJson();
    if (!packageJson) {
      this.addIssue('No package.json found', 'Cannot assess production configuration');
      return;
    }
    
    // Check for production scripts
    const scripts = packageJson.scripts || {};
    const hasProductionScripts = ['build', 'start'].every(script => scripts[script]);
    
    if (hasProductionScripts) {
      score += 0.5;
      this.addScore(0.5, 0.5, 'Production scripts (build, start) configured');
    } else {
      this.addIssue('Missing production scripts', 'Add build and start scripts for production deployment');
    }
    
    // Check for environment configuration
    const hasEnvConfig = await this.fileExists('.env.example') || 
                        await this.fileExists('.env.template') ||
                        await this.fileExists('config/') ||
                        (packageJson.config !== undefined);
    
    if (hasEnvConfig) {
      score += 0.5;
      this.addScore(0.5, 0.5, 'Environment configuration detected');
    } else {
      this.addIssue('No environment configuration', 'Add .env.example or config documentation');
    }
    
    // Check for deployment configuration
    const deploymentFiles = [
      'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml',
      'vercel.json', 'netlify.toml', '.platform.yml',
      'app.json', 'Procfile', 'railway.json'
    ];
    
    const hasDeploymentConfig = deploymentFiles.some(file => this.fileExists(file));
    
    if (await hasDeploymentConfig) {
      score += 0.5;
      this.addScore(0.5, 0.5, 'Deployment configuration found');
    } else {
      this.addIssue('No deployment configuration', 'Add Dockerfile or platform-specific config');
    }
    
    // Check for CI/CD pipeline
    const ciFiles = [
      '.github/workflows/', '.gitlab-ci.yml', 
      'azure-pipelines.yml', 'Jenkinsfile', '.circleci/'
    ];
    
    let hasCiCd = false;
    for (const ciFile of ciFiles) {
      if (await this.fileExists(ciFile)) {
        hasCiCd = true;
        break;
      }
    }
    
    if (hasCiCd) {
      score += 0.5;
      this.addScore(0.5, 0.5, 'CI/CD pipeline configured');
    } else {
      this.addIssue('No CI/CD pipeline', 'Set up automated testing and deployment');
    }
    
    this.setDetail('hasProductionScripts', hasProductionScripts);
    this.setDetail('hasEnvConfig', hasEnvConfig);
    this.setDetail('hasDeploymentConfig', await hasDeploymentConfig);
    this.setDetail('hasCiCd', hasCiCd);
  }

  async analyzeProjectMetadata() {
    let score = 0;
    const maxScore = 1;
    
    const packageJson = await this.readPackageJson();
    if (!packageJson) {
      this.addIssue('No package.json found', 'Cannot assess project metadata');
      return;
    }
    
    // Check for essential package.json fields
    const essentialFields = ['name', 'version', 'description'];
    const hasEssentialFields = essentialFields.every(field => packageJson[field]);
    
    if (hasEssentialFields) {
      score += 0.3;
      this.addScore(0.3, 0.3, 'Essential package.json fields present');
    } else {
      this.addIssue('Missing package.json metadata', 'Add name, version, and description');
    }
    
    // Check for additional metadata
    const metadataFields = [
      'author', 'repository', 'homepage', 'bugs', 'keywords', 'license'
    ];
    const metadataCount = metadataFields.filter(field => packageJson[field]).length;
    
    if (metadataCount >= 4) {
      score += 0.4;
      this.addScore(0.4, 0.4, `Comprehensive metadata (${metadataCount}/6 fields)`);
    } else if (metadataCount >= 2) {
      score += 0.2;
      this.addScore(0.2, 0.4, `Basic metadata (${metadataCount}/6 fields)`);
    } else {
      this.addIssue('Limited project metadata', 'Add author, repository, license info');
    }
    
    // Check for license file
    const licenseFiles = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENCE'];
    let hasLicenseFile = false;
    
    for (const licenseFile of licenseFiles) {
      if (await this.fileExists(licenseFile)) {
        hasLicenseFile = true;
        break;
      }
    }
    
    if (hasLicenseFile || packageJson.license) {
      score += 0.3;
      this.addScore(0.3, 0.3, 'License information provided');
    } else {
      this.addIssue('No license specified', 'Add LICENSE file and license field to package.json');
    }
    
    this.setDetail('hasEssentialFields', hasEssentialFields);
    this.setDetail('metadataFieldCount', metadataCount);
    this.setDetail('hasLicense', hasLicenseFile || !!packageJson.license);
  }
}