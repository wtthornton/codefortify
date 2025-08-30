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
    
    // QUICK WIN: Context7/MCP compliance deep validation (+2 bonus points)
    await this.analyzeContext7MCPCompliance(); // bonus 2pts
  }

  /**
   * QUICK WIN: Deep Context7/MCP compliance validation
   * @returns {Promise<void>}
   */
  async analyzeContext7MCPCompliance() {
    let score = 0;
    const maxBonusScore = 2;
    let complianceIssues = [];
    let complianceFeatures = [];

    try {
      // 1. AGENTS.md deep validation (0.5pts)
      const agentsCompliance = await this.validateAgentsFileStructure();
      if (agentsCompliance.isValid) {
        score += 0.5;
        complianceFeatures.push('AGENTS.md structure');
      } else {
        complianceIssues.push(...agentsCompliance.issues);
      }

      // 2. CLAUDE.md deep validation (0.5pts)
      const claudeCompliance = await this.validateClaudeFileStructure();
      if (claudeCompliance.isValid) {
        score += 0.5;
        complianceFeatures.push('CLAUDE.md structure');
      } else {
        complianceIssues.push(...claudeCompliance.issues);
      }

      // 3. MCP Server implementation quality (0.5pts)
      const mcpServerQuality = await this.analyzeMCPServerImplementation();
      if (mcpServerQuality.isValid) {
        score += 0.5;
        complianceFeatures.push('MCP server implementation');
      } else {
        complianceIssues.push(...mcpServerQuality.issues);
      }

      // 4. Agent OS configuration quality (0.5pts)
      const agentOsCompliance = await this.validateAgentOSConfiguration();
      if (agentOsCompliance.isValid) {
        score += 0.5;
        complianceFeatures.push('Agent OS configuration');
      } else {
        complianceIssues.push(...agentOsCompliance.issues);
      }

      // Apply scoring
      if (score > 0) {
        this.addScore(score, maxBonusScore, `Context7/MCP compliance features: ${complianceFeatures.join(', ')}`);
      }

      // Report issues
      for (const issue of complianceIssues) {
        this.addIssue(issue.title, issue.description);
      }

      this.setDetail('context7Compliance', {
        score,
        features: complianceFeatures,
        issues: complianceIssues.length
      });

    } catch (error) {
      this.addIssue('Context7/MCP compliance analysis failed', error.message);
    }
  }

  /**
   * Validate AGENTS.md file structure and content
   */
  async validateAgentsFileStructure() {
    try {
      if (!await this.fileExists('AGENTS.md')) {
        return { isValid: false, issues: [{ title: 'AGENTS.md missing', description: 'Create AGENTS.md following Context7 standards' }] };
      }

      const content = await this.readFile('AGENTS.md');
      const issues = [];
      let validSections = 0;

      // Check for required sections
      const requiredSections = [
        'Project Overview',
        'Dev Environment Tips', 
        'Testing Instructions',
        'PR Instructions'
      ];

      for (const section of requiredSections) {
        if (content.includes(section) || content.includes(section.toLowerCase())) {
          validSections++;
        } else {
          issues.push({ title: `AGENTS.md missing ${section}`, description: `Add ${section} section to AGENTS.md` });
        }
      }

      // Check for development commands
      if (!content.includes('npm') && !content.includes('yarn') && !content.includes('scripts')) {
        issues.push({ title: 'AGENTS.md missing development commands', description: 'Add setup and development commands section' });
      } else {
        validSections++;
      }

      return { isValid: validSections >= 4, issues };
    } catch (error) {
      return { isValid: false, issues: [{ title: 'AGENTS.md validation failed', description: error.message }] };
    }
  }

  /**
   * Validate CLAUDE.md file structure and content  
   */
  async validateClaudeFileStructure() {
    try {
      if (!await this.fileExists('CLAUDE.md')) {
        return { isValid: false, issues: [{ title: 'CLAUDE.md missing', description: 'Create CLAUDE.md following Context7 standards' }] };
      }

      const content = await this.readFile('CLAUDE.md');
      const issues = [];
      let validSections = 0;

      // Check for development commands section
      if (content.includes('Development Commands') || content.includes('Scripts')) {
        validSections++;
      } else {
        issues.push({ title: 'CLAUDE.md missing development commands', description: 'Add Development Commands section' });
      }

      // Check for project architecture description
      if (content.includes('Architecture') || content.includes('Project Structure') || content.includes('Components')) {
        validSections++;
      } else {
        issues.push({ title: 'CLAUDE.md missing architecture info', description: 'Add project architecture description' });
      }

      // Check for dependency information
      if (content.includes('Dependencies') || content.includes('Key Dependencies')) {
        validSections++;
      } else {
        issues.push({ title: 'CLAUDE.md missing dependency info', description: 'Add key dependencies section' });
      }

      return { isValid: validSections >= 2, issues };
    } catch (error) {
      return { isValid: false, issues: [{ title: 'CLAUDE.md validation failed', description: error.message }] };
    }
  }

  /**
   * Analyze MCP server implementation quality
   */
  async analyzeMCPServerImplementation() {
    try {
      const issues = [];
      let qualityScore = 0;

      // Check for MCP server file
      const mcpServerExists = await this.fileExists('src/mcp-server.js') || 
                            await this.fileExists('mcp-server.js') ||
                            await this.fileExists('src/server/mcp-server.js');

      if (!mcpServerExists) {
        return { isValid: false, issues: [{ title: 'MCP server missing', description: 'Create MCP server implementation' }] };
      }

      // Find and analyze MCP server file
      const serverFiles = ['src/mcp-server.js', 'mcp-server.js', 'src/server/mcp-server.js'];
      let serverContent = '';

      for (const file of serverFiles) {
        if (await this.fileExists(file)) {
          serverContent = await this.readFile(file);
          break;
        }
      }

      if (serverContent) {
        // Check for MCP protocol implementation
        if (serverContent.includes('@modelcontextprotocol') || serverContent.includes('MCP')) {
          qualityScore++;
        }

        // Check for resource handlers
        if (serverContent.includes('list_resources') || serverContent.includes('listResources')) {
          qualityScore++;
        }

        // Check for tool handlers  
        if (serverContent.includes('list_tools') || serverContent.includes('listTools')) {
          qualityScore++;
        }

        // Check for proper error handling
        if (serverContent.includes('try') && serverContent.includes('catch')) {
          qualityScore++;
        }
      }

      return { isValid: qualityScore >= 3, issues: qualityScore < 3 ? 
        [{ title: 'MCP server implementation incomplete', description: 'Enhance MCP server with proper resource/tool handlers' }] : [] };

    } catch (error) {
      return { isValid: false, issues: [{ title: 'MCP server analysis failed', description: error.message }] };
    }
  }

  /**
   * Validate Agent OS configuration
   */
  async validateAgentOSConfiguration() {
    try {
      const issues = [];
      let validConfig = 0;

      // Check for .agent-os directory
      if (!await this.fileExists('.agent-os')) {
        return { isValid: false, issues: [{ title: 'Agent OS directory missing', description: 'Create .agent-os configuration directory' }] };
      }

      // Check for agent-os config file
      const configExists = await this.fileExists('.agent-os/config.yml') ||
                          await this.fileExists('.agent-os/config.yaml') ||
                          await this.fileExists('.agent-os/agent-os.yml');

      if (configExists) {
        validConfig++;
      } else {
        issues.push({ title: 'Agent OS config missing', description: 'Add agent-os configuration file' });
      }

      // Check for MCP configuration  
      const mcpConfigExists = await this.fileExists('.agent-os/mcp-config.json') ||
                             await this.fileExists('.agent-os/mcp.json');

      if (mcpConfigExists) {
        validConfig++;
      } else {
        issues.push({ title: 'MCP configuration missing', description: 'Add MCP configuration in .agent-os/' });
      }

      return { isValid: validConfig >= 1, issues };
    } catch (error) {
      return { isValid: false, issues: [{ title: 'Agent OS validation failed', description: error.message }] };
    }
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