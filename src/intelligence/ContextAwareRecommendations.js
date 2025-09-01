/**
 * Context-Aware Recommendations Engine
 * Provides intelligent, contextual recommendations based on project type, file context, and development patterns
 */

import { EventEmitter } from 'events';
import path from 'path';

export class ContextAwareRecommendations extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            maxRecommendations: 10,
            minConfidence: 0.6,
            contextWindow: 50, // lines of context to analyze
            learningEnabled: true,
            ...options
        };
        
        this.projectContext = null;
        this.frameworkContext = null;
        this.codeContext = new Map(); // file -> context data
        this.patternDatabase = new Map();
        this.userPreferences = new Map();
        this.successfulRecommendations = new Map();
        
        // Initialize recommendation engines
        this.engines = {
            framework: new FrameworkSpecificEngine(),
            security: new SecurityRecommendationEngine(),
            performance: new PerformanceRecommendationEngine(),
            quality: new QualityRecommendationEngine(),
            testing: new TestingRecommendationEngine(),
            accessibility: new AccessibilityRecommendationEngine()
        };
        
        this.contextAnalyzer = new CodeContextAnalyzer();
        this.recommendationRanker = new RecommendationRanker();
    }
    
    /**
     * Initialize the recommendations engine with project context
     */
    async initialize(projectRoot, projectContext) {
        this.projectRoot = projectRoot;
        this.projectContext = projectContext;
        
        console.log('🧠 Initializing Context-Aware Recommendations Engine...');
        
        // Detect framework and project characteristics
        this.frameworkContext = await this.detectFrameworkContext();
        
        // Load existing patterns and preferences
        await this.loadPatternDatabase();
        await this.loadUserPreferences();
        
        // Initialize all recommendation engines
        for (const [name, engine] of Object.entries(this.engines)) {
            await engine.initialize(this.frameworkContext, this.projectContext);
        }
        
        console.log(`✅ Context-Aware Recommendations Engine initialized`);
        console.log(`   Framework: ${this.frameworkContext.name}`);
        console.log(`   Engines: ${Object.keys(this.engines).length}`);
        
        this.emit('initialized', {
            framework: this.frameworkContext,
            engines: Object.keys(this.engines),
            patterns: this.patternDatabase.size
        });
    }
    
    /**
     * Generate context-aware recommendations for a file
     */
    async generateRecommendations(filePath, fileContent, analysisResults = null) {
        const startTime = Date.now();
        
        try {
            // Analyze code context
            const codeContext = await this.contextAnalyzer.analyze(filePath, fileContent, {
                framework: this.frameworkContext,
                project: this.projectContext,
                contextWindow: this.options.contextWindow
            });
            
            this.codeContext.set(filePath, codeContext);
            
            // Generate recommendations from all engines
            const allRecommendations = [];
            
            for (const [engineName, engine] of Object.entries(this.engines)) {
                try {
                    const engineRecommendations = await engine.generateRecommendations(
                        filePath,
                        fileContent,
                        codeContext,
                        analysisResults
                    );
                    
                    // Add metadata
                    engineRecommendations.forEach(rec => {
                        rec.engine = engineName;
                        rec.timestamp = Date.now();
                        rec.filePath = filePath;
                    });
                    
                    allRecommendations.push(...engineRecommendations);
                    
                } catch (error) {
                    console.error(`Error in ${engineName} engine:`, error);
                }
            }
            
            // Rank and filter recommendations
            const rankedRecommendations = await this.recommendationRanker.rank(
                allRecommendations,
                codeContext,
                this.userPreferences,
                this.successfulRecommendations
            );
            
            // Apply filters
            const filteredRecommendations = rankedRecommendations
                .filter(rec => rec.confidence >= this.options.minConfidence)
                .slice(0, this.options.maxRecommendations);
            
            // Learn from context patterns
            if (this.options.learningEnabled) {
                await this.learnFromContext(codeContext, filteredRecommendations);
            }
            
            const duration = Date.now() - startTime;
            
            console.log(`🎯 Generated ${filteredRecommendations.length} recommendations for ${filePath} (${duration}ms)`);
            
            this.emit('recommendationsGenerated', {
                filePath,
                recommendations: filteredRecommendations.length,
                duration,
                engines: Object.keys(this.engines)
            });
            
            return {
                filePath,
                recommendations: filteredRecommendations,
                context: codeContext,
                metadata: {
                    totalGenerated: allRecommendations.length,
                    filtered: filteredRecommendations.length,
                    duration,
                    timestamp: Date.now()
                }
            };
            
        } catch (error) {
            console.error('Error generating recommendations:', error);
            throw error;
        }
    }
    
    /**
     * Get recommendations for entire project
     */
    async generateProjectRecommendations(analysisResults) {
        console.log('🌟 Generating project-wide recommendations...');
        
        const projectRecommendations = {
            architectural: [],
            configuration: [],
            workflow: [],
            quality: [],
            security: [],
            performance: []
        };
        
        // Architectural recommendations
        projectRecommendations.architectural = await this.generateArchitecturalRecommendations();
        
        // Configuration recommendations
        projectRecommendations.configuration = await this.generateConfigurationRecommendations();
        
        // Workflow recommendations
        projectRecommendations.workflow = await this.generateWorkflowRecommendations();
        
        // Quality improvements based on analysis
        if (analysisResults) {
            projectRecommendations.quality = await this.generateQualityRecommendations(analysisResults);
            projectRecommendations.security = await this.generateSecurityRecommendations(analysisResults);
            projectRecommendations.performance = await this.generatePerformanceRecommendations(analysisResults);
        }
        
        return projectRecommendations;
    }
    
    /**
     * Detect framework and project context
     */
    async detectFrameworkContext() {
        const packageJson = this.projectContext.packageJson || {};
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        let framework = { name: 'javascript', version: null, features: [] };
        
        // React detection
        if (dependencies.react) {
            framework = {
                name: 'react',
                version: dependencies.react,
                features: [
                    dependencies['react-router-dom'] && 'routing',
                    dependencies['@reduxjs/toolkit'] && 'redux-toolkit',
                    dependencies.redux && 'redux',
                    dependencies['react-query'] && 'react-query',
                    dependencies.typescript && 'typescript',
                    dependencies['@testing-library/react'] && 'testing-library'
                ].filter(Boolean),
                patterns: this.getReactPatterns(),
                conventions: this.getReactConventions()
            };
        }
        
        // Vue detection
        else if (dependencies.vue) {
            framework = {
                name: 'vue',
                version: dependencies.vue,
                features: [
                    dependencies['vue-router'] && 'router',
                    dependencies.vuex && 'vuex',
                    dependencies.pinia && 'pinia',
                    dependencies.typescript && 'typescript'
                ].filter(Boolean),
                patterns: this.getVuePatterns(),
                conventions: this.getVueConventions()
            };
        }
        
        // Node.js/Express detection
        else if (dependencies.express || dependencies.fastify || dependencies.koa) {
            const serverFramework = dependencies.express ? 'express' : 
                                   dependencies.fastify ? 'fastify' : 'koa';
            
            framework = {
                name: 'node',
                serverFramework,
                version: dependencies[serverFramework],
                features: [
                    dependencies.mongoose && 'mongoose',
                    dependencies.prisma && 'prisma',
                    dependencies.typeorm && 'typeorm',
                    dependencies.passport && 'passport',
                    dependencies.joi && 'joi',
                    dependencies.yup && 'yup'
                ].filter(Boolean),
                patterns: this.getNodePatterns(),
                conventions: this.getNodeConventions()
            };
        }
        
        // Add common project characteristics
        framework.projectType = this.detectProjectType(packageJson);
        framework.testingFramework = this.detectTestingFramework(dependencies);
        framework.buildTool = this.detectBuildTool(dependencies);
        framework.linting = this.detectLintingSetup(dependencies);
        
        return framework;
    }
    
    /**
     * Generate architectural recommendations
     */
    async generateArchitecturalRecommendations() {
        const recommendations = [];
        
        // Analyze current project structure
        const projectStructure = await this.analyzeProjectStructure();
        
        // Framework-specific architectural recommendations
        switch (this.frameworkContext.name) {
            case 'react':
                recommendations.push(...this.getReactArchitecturalRecommendations(projectStructure));
                break;
            case 'vue':
                recommendations.push(...this.getVueArchitecturalRecommendations(projectStructure));
                break;
            case 'node':
                recommendations.push(...this.getNodeArchitecturalRecommendations(projectStructure));
                break;
        }
        
        return recommendations;
    }
    
    /**
     * React-specific patterns and recommendations
     */
    getReactPatterns() {
        return {
            componentStructure: {
                pattern: /^(function|const)\\s+([A-Z]\\w+)/,
                recommendation: 'Use PascalCase for React components',
                examples: ['function MyComponent()', 'const MyComponent = ()']
            },
            hooksUsage: {
                pattern: /use[A-Z]\\w*/,
                recommendation: 'Follow hooks naming convention',
                bestPractices: [
                    'Only call hooks at the top level',
                    'Use custom hooks for reusable logic',
                    'Include dependencies in useEffect arrays'
                ]
            },
            stateManagement: {
                patterns: ['useState', 'useReducer', 'useContext'],
                recommendations: {
                    simple: 'Use useState for simple state',
                    complex: 'Use useReducer for complex state logic',
                    global: 'Use Context API or Redux for global state'
                }
            },
            performanceOptimization: {
                patterns: ['React.memo', 'useMemo', 'useCallback'],
                recommendations: [
                    'Memoize expensive calculations',
                    'Use React.memo for pure components',
                    'Optimize re-renders with useCallback'
                ]
            }
        };
    }
    
    /**
     * React architectural recommendations
     */
    getReactArchitecturalRecommendations(structure) {
        const recommendations = [];
        
        if (!structure.hasComponentsFolder) {
            recommendations.push({
                type: 'architectural',
                category: 'structure',
                title: 'Create components directory structure',
                description: 'Organize React components in a dedicated folder structure',
                impact: 'high',
                confidence: 0.9,
                suggestion: 'Create src/components/ with subfolders for different component types',
                implementation: {
                    steps: [
                        'Create src/components/ directory',
                        'Create subdirectories: ui/, forms/, layout/', 
                        'Move existing components to appropriate folders',
                        'Update import paths'
                    ],
                    estimatedTime: '30 minutes'
                }
            });
        }
        
        if (!structure.hasHooksFolder && structure.customHooksCount > 3) {
            recommendations.push({
                type: 'architectural',
                category: 'hooks',
                title: 'Organize custom hooks',
                description: 'Create dedicated folder for reusable custom hooks',
                impact: 'medium',
                confidence: 0.8,
                suggestion: 'Move custom hooks to src/hooks/ directory',
                implementation: {
                    steps: [
                        'Create src/hooks/ directory',
                        'Move custom hooks from components',
                        'Create index.js for easy imports',
                        'Update import statements'
                    ],
                    estimatedTime: '20 minutes'
                }
            });
        }
        
        if (structure.needsStateManagement) {
            recommendations.push({
                type: 'architectural',
                category: 'state',
                title: 'Implement proper state management',
                description: 'Project complexity suggests need for centralized state management',
                impact: 'high',
                confidence: 0.85,
                suggestion: 'Consider React Context API or Redux Toolkit',
                implementation: {
                    options: [
                        {
                            name: 'Context API',
                            pros: ['Built into React', 'No additional dependencies', 'Good for medium complexity'],
                            cons: ['Performance concerns with frequent updates', 'Limited debugging tools']
                        },
                        {
                            name: 'Redux Toolkit',
                            pros: ['Excellent DevTools', 'Predictable state updates', 'Time travel debugging'],
                            cons: ['Additional learning curve', 'More boilerplate']
                        }
                    ],
                    estimatedTime: '2-4 hours'
                }
            });
        }
        
        return recommendations;
    }
    
    /**
     * Generate configuration recommendations
     */
    async generateConfigurationRecommendations() {
        const recommendations = [];
        const packageJson = this.projectContext.packageJson || {};
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        // ESLint configuration
        if (!dependencies.eslint) {
            recommendations.push({
                type: 'configuration',
                category: 'linting',
                title: 'Add ESLint for code quality',
                description: 'ESLint helps catch errors and enforce consistent coding style',
                impact: 'high',
                confidence: 0.95,
                priority: 'critical',
                implementation: {
                    commands: [
                        'npm install --save-dev eslint',
                        'npx eslint --init'
                    ],
                    configExample: {
                        extends: ['eslint:recommended'],
                        parserOptions: { ecmaVersion: 2021, sourceType: 'module' },
                        rules: {
                            'no-unused-vars': 'warn',
                            'no-console': 'warn'
                        }
                    }
                }
            });
        }
        
        // Prettier configuration
        if (!dependencies.prettier) {
            recommendations.push({
                type: 'configuration',
                category: 'formatting',
                title: 'Add Prettier for consistent formatting',
                description: 'Prettier automatically formats code to maintain consistency',
                impact: 'medium',
                confidence: 0.9,
                priority: 'high',
                implementation: {
                    commands: ['npm install --save-dev prettier'],
                    configExample: {
                        semi: true,
                        singleQuote: true,
                        tabWidth: 2,
                        trailingComma: 'es5'
                    }
                }
            });
        }
        
        // TypeScript for JavaScript projects
        if (!dependencies.typescript && this.frameworkContext.name === 'react') {
            recommendations.push({
                type: 'configuration',
                category: 'type-safety',
                title: 'Consider adding TypeScript',
                description: 'TypeScript provides static type checking and better IDE support',
                impact: 'high',
                confidence: 0.75,
                priority: 'medium',
                implementation: {
                    commands: [
                        'npm install --save-dev typescript @types/react @types/react-dom',
                        'npx tsc --init'
                    ],
                    migrationSteps: [
                        'Rename .js files to .ts/.tsx gradually',
                        'Add type annotations incrementally',
                        'Configure tsconfig.json for your needs'
                    ]
                }
            });
        }
        
        return recommendations;
    }
    
    /**
     * Learn from context patterns
     */
    async learnFromContext(codeContext, recommendations) {
        // Store successful context patterns
        const contextPattern = {
            framework: this.frameworkContext.name,
            fileType: codeContext.fileType,
            complexity: codeContext.complexity,
            patterns: codeContext.detectedPatterns,
            timestamp: Date.now()
        };
        
        const patternKey = `${contextPattern.framework}-${contextPattern.fileType}`;
        
        if (!this.patternDatabase.has(patternKey)) {
            this.patternDatabase.set(patternKey, []);
        }
        
        this.patternDatabase.get(patternKey).push(contextPattern);
        
        // Store recommendation contexts for future ranking
        for (const recommendation of recommendations) {
            const recKey = `${recommendation.engine}-${recommendation.category}`;
            if (!this.successfulRecommendations.has(recKey)) {
                this.successfulRecommendations.set(recKey, []);
            }
            
            this.successfulRecommendations.get(recKey).push({
                context: codeContext,
                recommendation,
                timestamp: Date.now()
            });
        }
    }
    
    /**
     * Track recommendation acceptance/rejection
     */
    onRecommendationFeedback(recommendationId, feedback) {
        // feedback: 'accepted', 'rejected', 'modified'
        console.log(`📝 Recommendation feedback: ${recommendationId} -> ${feedback}`);
        
        // Update recommendation ranking based on feedback
        this.recommendationRanker.updateRanking(recommendationId, feedback);
        
        // Learn from user preferences
        this.updateUserPreferences(recommendationId, feedback);
        
        this.emit('recommendationFeedback', { recommendationId, feedback });
    }
    
    /**
     * Update user preferences based on feedback
     */
    updateUserPreferences(recommendationId, feedback) {
        // Extract patterns from accepted/rejected recommendations
        // This would be more sophisticated in a real implementation
        
        if (feedback === 'accepted') {
            // Increase preference for similar recommendation types
        } else if (feedback === 'rejected') {
            // Decrease preference for similar recommendation types
        }
    }
    
    /**
     * Helper methods for project analysis
     */
    async analyzeProjectStructure() {
        // This would analyze the actual project structure
        return {
            hasComponentsFolder: false,
            hasHooksFolder: false,
            customHooksCount: 5,
            needsStateManagement: true,
            componentCount: 15,
            averageComponentSize: 150
        };
    }
    
    detectProjectType(packageJson) {
        if (packageJson.scripts?.build && packageJson.scripts?.start) {
            return 'web-application';
        }
        if (packageJson.scripts?.test) {
            return 'library';
        }
        if (packageJson.main || packageJson.bin) {
            return 'package';
        }
        return 'unknown';
    }
    
    detectTestingFramework(dependencies) {
        if (dependencies.jest) return 'jest';
        if (dependencies.vitest) return 'vitest';
        if (dependencies.mocha) return 'mocha';
        if (dependencies.cypress) return 'cypress';
        return null;
    }
    
    detectBuildTool(dependencies) {
        if (dependencies.webpack) return 'webpack';
        if (dependencies.vite) return 'vite';
        if (dependencies.rollup) return 'rollup';
        if (dependencies.parcel) return 'parcel';
        return null;
    }
    
    detectLintingSetup(dependencies) {
        return {
            eslint: !!dependencies.eslint,
            prettier: !!dependencies.prettier,
            typescript: !!dependencies.typescript
        };
    }
    
    async loadPatternDatabase() {
        // Load stored patterns from file system or database
        this.patternDatabase = new Map();
    }
    
    async loadUserPreferences() {
        // Load user preferences from storage
        this.userPreferences = new Map();
    }
    
    // Placeholder methods for other framework conventions
    getReactConventions() { return {}; }
    getVuePatterns() { return {}; }
    getVueConventions() { return {}; }
    getVueArchitecturalRecommendations() { return []; }
    getNodePatterns() { return {}; }
    getNodeConventions() { return {}; }
    getNodeArchitecturalRecommendations() { return []; }
    async generateWorkflowRecommendations() { return []; }
    async generateQualityRecommendations() { return []; }
    async generateSecurityRecommendations() { return []; }
    async generatePerformanceRecommendations() { return []; }
}

/**
 * Code Context Analyzer
 */
class CodeContextAnalyzer {
    async analyze(filePath, fileContent, options) {
        const context = {
            filePath,
            fileName: path.basename(filePath),
            fileExtension: path.extname(filePath),
            fileType: this.determineFileType(filePath),
            lines: fileContent.split('\n'),
            complexity: this.calculateComplexity(fileContent),
            dependencies: this.extractDependencies(fileContent),
            detectedPatterns: this.detectPatterns(fileContent, options.framework),
            functions: this.extractFunctions(fileContent),
            classes: this.extractClasses(fileContent),
            exports: this.extractExports(fileContent),
            imports: this.extractImports(fileContent)
        };
        
        return context;
    }
    
    determineFileType(filePath) {
        const extension = path.extname(filePath).toLowerCase();
        const basename = path.basename(filePath).toLowerCase();
        
        if (basename.includes('test') || basename.includes('spec')) return 'test';
        if (basename.includes('config')) return 'config';
        if (extension === '.jsx' || extension === '.tsx') return 'component';
        if (extension === '.js' || extension === '.ts') return 'module';
        if (extension === '.css' || extension === '.scss') return 'styles';
        
        return 'unknown';
    }
    
    calculateComplexity(code) {
        // Simplified complexity calculation
        const lines = code.split('\n').length;
        const functions = (code.match(/function|=>/g) || []).length;
        const conditions = (code.match(/if|while|for|switch/g) || []).length;
        
        return {
            lines,
            functions,
            conditions,
            score: Math.min((lines / 20) + (functions / 5) + (conditions / 3), 10)
        };
    }
    
    extractDependencies(code) {
        const importRegex = /import.*from ['"]([^'"]+)['"]/g;
        const requireRegex = /require\\(['"]([^'"]+)['"]\\)/g;
        
        const dependencies = new Set();
        
        let match;
        while ((match = importRegex.exec(code)) !== null) {
            dependencies.add(match[1]);
        }
        
        while ((match = requireRegex.exec(code)) !== null) {
            dependencies.add(match[1]);
        }
        
        return Array.from(dependencies);
    }
    
    detectPatterns(code, framework) {
        const patterns = [];
        
        // React patterns
        if (framework.name === 'react') {
            if (code.includes('useState')) patterns.push('react-hooks');
            if (code.includes('useEffect')) patterns.push('react-effects');
            if (code.includes('React.memo')) patterns.push('react-optimization');
            if (code.includes('jsx')) patterns.push('jsx');
        }
        
        // General patterns
        if (code.includes('async') || code.includes('await')) patterns.push('async-await');
        if (code.includes('Promise')) patterns.push('promises');
        if (code.includes('class')) patterns.push('classes');
        if (code.includes('=>')) patterns.push('arrow-functions');
        
        return patterns;
    }
    
    extractFunctions(code) {
        // Simplified function extraction
        const functionRegex = /(?:function\\s+(\\w+)|const\\s+(\\w+)\\s*=|\\s+(\\w+)\\s*:)/g;
        const functions = [];
        
        let match;
        while ((match = functionRegex.exec(code)) !== null) {
            functions.push(match[1] || match[2] || match[3]);
        }
        
        return functions;
    }
    
    extractClasses(code) {
        const classRegex = /class\\s+(\\w+)/g;
        const classes = [];
        
        let match;
        while ((match = classRegex.exec(code)) !== null) {
            classes.push(match[1]);
        }
        
        return classes;
    }
    
    extractExports(code) {
        const exportRegex = /export\\s+(?:default\\s+)?(\\w+)|export\\s*{([^}]+)}/g;
        const exports = [];
        
        let match;
        while ((match = exportRegex.exec(code)) !== null) {
            if (match[1]) {
                exports.push(match[1]);
            } else if (match[2]) {
                exports.push(...match[2].split(',').map(e => e.trim()));
            }
        }
        
        return exports;
    }
    
    extractImports(code) {
        const importRegex = /import\\s+(?:{([^}]+)}|([^\\s,]+))\\s+from\\s+['"]([^'"]+)['"]/g;
        const imports = [];
        
        let match;
        while ((match = importRegex.exec(code)) !== null) {
            imports.push({
                named: match[1] ? match[1].split(',').map(i => i.trim()) : null,
                default: match[2] || null,
                source: match[3]
            });
        }
        
        return imports;
    }
}

/**
 * Recommendation Ranking System
 */
class RecommendationRanker {
    async rank(recommendations, codeContext, userPreferences, successfulRecommendations) {
        return recommendations
            .map(rec => ({
                ...rec,
                rankingScore: this.calculateRankingScore(rec, codeContext, userPreferences, successfulRecommendations)
            }))
            .sort((a, b) => b.rankingScore - a.rankingScore);
    }
    
    calculateRankingScore(recommendation, codeContext, userPreferences, successfulRecommendations) {
        let score = recommendation.confidence || 0.5;
        
        // Boost based on impact
        const impactBoost = {
            'critical': 0.3,
            'high': 0.2,
            'medium': 0.1,
            'low': 0.05
        };
        score += impactBoost[recommendation.impact] || 0;
        
        // Context relevance boost
        if (recommendation.category && codeContext.detectedPatterns.includes(recommendation.category)) {
            score += 0.15;
        }
        
        // User preference boost (would be implemented based on historical data)
        
        return Math.min(score, 1.0);
    }
    
    updateRanking(recommendationId, feedback) {
        // Update ranking algorithm based on feedback
        console.log(`Updating ranking for ${recommendationId}: ${feedback}`);
    }
}

/**
 * Framework-specific recommendation engines
 */
class FrameworkSpecificEngine {
    async initialize(framework, project) {
        this.framework = framework;
        this.project = project;
    }
    
    async generateRecommendations(filePath, content, context, analysis) {
        return []; // Framework-specific recommendations
    }
}

class SecurityRecommendationEngine {
    async initialize() {}
    async generateRecommendations() { return []; }
}

class PerformanceRecommendationEngine {
    async initialize() {}
    async generateRecommendations() { return []; }
}

class QualityRecommendationEngine {
    async initialize() {}
    async generateRecommendations() { return []; }
}

class TestingRecommendationEngine {
    async initialize() {}
    async generateRecommendations() { return []; }
}

class AccessibilityRecommendationEngine {
    async initialize() {}
    async generateRecommendations() { return []; }
}

export default ContextAwareRecommendations;