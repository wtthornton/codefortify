/**
 * Smart File Analysis Trigger System
 * Intelligently triggers analysis based on file importance, change impact, and project context
 */

import { EventEmitter } from 'events';
import { watch } from 'chokidar';
import path from 'path';

export class SmartAnalysisTrigger extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            debounceDelay: 2000,
            batchSize: 10,
            priorityThreshold: 0.7,
            maxConcurrentAnalysis: 3,
            ...options
        };
        
        this.fileWatcher = null;
        this.analysisQueue = new Map(); // file -> analysis request
        this.currentAnalysis = new Set();
        this.debounceTimers = new Map();
        this.fileImportance = new Map();
        this.projectContext = null;
        
        // File importance scoring
        this.importanceRules = {
            // Critical infrastructure files
            critical: [
                /^src\/(index|main|app)\.(js|ts|jsx|tsx)$/,
                /package\.json$/,
                /tsconfig\.json$/,
                /webpack\.config\.(js|ts)$/,
                /vite\.config\.(js|ts)$/,
                /^src\/routes?\//,
                /^src\/api\//,
                /^src\/server\//
            ],
            
            // High importance files
            high: [
                /^src\/components?\//,
                /^src\/pages?\//,
                /^src\/views?\//,
                /^src\/services?\//,
                /^src\/stores?\//,
                /^src\/contexts?\//,
                /^src\/hooks?\//,
                /^src\/utils?\//,
                /^src\/lib\//
            ],
            
            // Medium importance files
            medium: [
                /^src\/types?\//,
                /^src\/interfaces?\//,
                /^src\/models?\//,
                /^src\/constants?\//,
                /^src\/config\//,
                /\.test\.(js|ts|jsx|tsx)$/,
                /\.spec\.(js|ts|jsx|tsx)$/
            ],
            
            // Low importance files
            low: [
                /^docs?\//,
                /^examples?\//,
                /^scripts?\//,
                /\.md$/,
                /\.txt$/,
                /\.(css|scss|less)$/,
                /\.(png|jpg|jpeg|gif|svg)$/
            ]
        };
        
        this.changeImpactAnalyzer = new ChangeImpactAnalyzer();
        this.dependencyGraph = new Map();
    }
    
    /**
     * Initialize smart analysis triggers
     */
    async initialize(projectRoot, projectContext) {
        this.projectRoot = projectRoot;
        this.projectContext = projectContext;
        
        console.log('🎯 Initializing Smart Analysis Triggers...');
        
        // Build dependency graph for impact analysis
        await this.buildDependencyGraph();
        
        // Calculate file importance scores
        await this.calculateFileImportance();
        
        // Start file watching
        this.startFileWatcher();
        
        console.log(`✅ Smart Analysis Triggers active - tracking ${this.fileImportance.size} files`);
        
        this.emit('initialized', {
            trackedFiles: this.fileImportance.size,
            criticalFiles: Array.from(this.fileImportance.entries())
                .filter(([_, score]) => score >= 0.8).length
        });
    }
    
    /**
     * Start intelligent file watching
     */
    startFileWatcher() {
        const watchPatterns = [
            'src/**/*.{js,ts,jsx,tsx,vue}',
            'package.json',
            'tsconfig.json',
            '*.config.{js,ts}',
            'src/**/*.{css,scss,less}',
            'tests/**/*.{js,ts}',
            '__tests__/**/*.{js,ts}'
        ];
        
        this.fileWatcher = watch(watchPatterns, {
            cwd: this.projectRoot,
            ignored: [
                'node_modules',
                'dist',
                'build',
                '.git',
                'coverage',
                '**/*.log'
            ],
            ignoreInitial: true,
            persistent: true
        });
        
        this.fileWatcher
            .on('change', (filePath) => this.onFileChanged(filePath, 'modified'))
            .on('add', (filePath) => this.onFileChanged(filePath, 'added'))
            .on('unlink', (filePath) => this.onFileChanged(filePath, 'deleted'))
            .on('error', (error) => {
                console.error('File watcher error:', error);
                this.emit('watcherError', error);
            });
        
        console.log(`👁️ File watcher active for patterns: ${watchPatterns.join(', ')}`);
    }
    
    /**
     * Handle file change events with intelligent processing
     */
    async onFileChanged(filePath, changeType) {
        const fullPath = path.resolve(this.projectRoot, filePath);
        const importance = this.getFileImportance(filePath);
        
        console.log(`📁 File ${changeType}: ${filePath} (importance: ${importance.toFixed(2)})`);
        
        // Clear existing debounce timer
        if (this.debounceTimers.has(filePath)) {
            clearTimeout(this.debounceTimers.get(filePath));
        }
        
        // Calculate change impact
        const impact = await this.analyzeChangeImpact(filePath, changeType);
        
        // Determine analysis priority
        const priority = this.calculateAnalysisPriority(importance, impact, changeType);
        
        // Create analysis request
        const analysisRequest = {
            filePath,
            fullPath,
            changeType,
            importance,
            impact,
            priority,
            timestamp: Date.now(),
            retries: 0
        };
        
        // Handle immediate vs debounced analysis
        if (priority >= this.options.priorityThreshold || changeType === 'added') {
            // High priority - analyze immediately
            this.scheduleAnalysis(analysisRequest, 0);
        } else {
            // Normal priority - debounce to batch changes
            const delay = this.calculateDebounceDelay(importance, impact);
            this.scheduleAnalysis(analysisRequest, delay);
        }
    }
    
    /**
     * Schedule analysis with intelligent debouncing
     */
    scheduleAnalysis(analysisRequest, delay) {
        const { filePath } = analysisRequest;
        
        // Update queue with latest request
        this.analysisQueue.set(filePath, analysisRequest);
        
        // Set debounce timer
        const timer = setTimeout(async () => {
            this.debounceTimers.delete(filePath);
            await this.processAnalysisRequest(analysisRequest);
        }, delay);
        
        this.debounceTimers.set(filePath, timer);
        
        this.emit('analysisScheduled', {
            filePath,
            priority: analysisRequest.priority,
            delay
        });
    }
    
    /**
     * Process analysis request with concurrency control
     */
    async processAnalysisRequest(analysisRequest) {
        const { filePath, priority } = analysisRequest;
        
        // Check if already analyzing
        if (this.currentAnalysis.has(filePath)) {
            console.log(`⏸️ Skipping ${filePath} - already analyzing`);
            return;
        }
        
        // Check concurrency limit
        if (this.currentAnalysis.size >= this.options.maxConcurrentAnalysis) {
            // Requeue for later if high priority
            if (priority >= this.options.priorityThreshold) {
                setTimeout(() => this.processAnalysisRequest(analysisRequest), 1000);
            }
            console.log(`🚦 Analysis queue full, deferring ${filePath}`);
            return;
        }
        
        this.currentAnalysis.add(filePath);
        this.analysisQueue.delete(filePath);
        
        try {
            console.log(`🔍 Starting smart analysis: ${filePath} (priority: ${priority.toFixed(2)})`);
            
            const startTime = Date.now();
            
            // Determine analysis scope based on impact
            const analysisScope = this.determineAnalysisScope(analysisRequest);
            
            // Trigger analysis
            await this.runTargetedAnalysis(analysisRequest, analysisScope);
            
            const duration = Date.now() - startTime;
            console.log(`✅ Analysis completed: ${filePath} (${duration}ms)`);
            
            this.emit('analysisCompleted', {
                filePath,
                duration,
                scope: analysisScope,
                priority
            });
            
        } catch (error) {
            console.error(`❌ Analysis failed: ${filePath}`, error);
            
            // Retry logic for important files
            if (analysisRequest.importance > 0.5 && analysisRequest.retries < 2) {
                analysisRequest.retries++;
                setTimeout(() => this.processAnalysisRequest(analysisRequest), 5000);
            }
            
            this.emit('analysisError', { filePath, error });
            
        } finally {
            this.currentAnalysis.delete(filePath);
            
            // Process next in queue
            this.processNextInQueue();
        }
    }
    
    /**
     * Calculate file importance score (0.0 - 1.0)
     */
    getFileImportance(filePath) {
        if (this.fileImportance.has(filePath)) {
            return this.fileImportance.get(filePath);
        }
        
        let importance = 0.1; // Default low importance
        
        // Check against importance rules
        for (const [level, patterns] of Object.entries(this.importanceRules)) {
            for (const pattern of patterns) {
                if (pattern.test(filePath)) {
                    switch (level) {
                        case 'critical': importance = Math.max(importance, 1.0); break;
                        case 'high': importance = Math.max(importance, 0.8); break;
                        case 'medium': importance = Math.max(importance, 0.5); break;
                        case 'low': importance = Math.max(importance, 0.2); break;
                    }
                }
            }
        }
        
        // Boost importance based on dependency count
        const dependents = this.dependencyGraph.get(filePath) || new Set();
        const dependencyBoost = Math.min(dependents.size * 0.1, 0.3);
        importance = Math.min(importance + dependencyBoost, 1.0);
        
        this.fileImportance.set(filePath, importance);
        return importance;
    }
    
    /**
     * Analyze change impact on related files
     */
    async analyzeChangeImpact(filePath, changeType) {
        const impact = {
            directDependents: new Set(),
            indirectDependents: new Set(),
            affectedTests: new Set(),
            bundleImpact: 0,
            riskScore: 0
        };
        
        // Find direct dependents
        const dependents = this.dependencyGraph.get(filePath) || new Set();
        impact.directDependents = new Set(dependents);
        
        // Find indirect dependents (2 levels deep)
        for (const dependent of dependents) {
            const indirectDeps = this.dependencyGraph.get(dependent) || new Set();
            for (const indirectDep of indirectDeps) {
                impact.indirectDependents.add(indirectDep);
            }
        }
        
        // Find related test files
        const testPatterns = [
            filePath.replace(/\.(js|ts|jsx|tsx)$/, '.test.$1'),
            filePath.replace(/\.(js|ts|jsx|tsx)$/, '.spec.$1'),
            filePath.replace(/^src\//, '__tests__/').replace(/\.(js|ts|jsx|tsx)$/, '.test.$1'),
            filePath.replace(/^src\//, 'tests/').replace(/\.(js|ts|jsx|tsx)$/, '.test.$1')
        ];
        
        for (const testPattern of testPatterns) {
            if (await this.fileExists(testPattern)) {
                impact.affectedTests.add(testPattern);
            }
        }
        
        // Calculate risk score based on change type and dependents
        impact.riskScore = this.calculateRiskScore(changeType, dependents.size, filePath);
        
        return impact;
    }
    
    /**
     * Calculate analysis priority based on importance and impact
     */
    calculateAnalysisPriority(importance, impact, changeType) {
        let priority = importance; // Base priority from file importance
        
        // Boost priority based on change impact
        const dependentCount = impact.directDependents.size + impact.indirectDependents.size;
        const impactBoost = Math.min(dependentCount * 0.1, 0.4);
        priority += impactBoost;
        
        // Boost priority for critical change types
        if (changeType === 'added' && importance > 0.7) {
            priority += 0.3; // New critical files need immediate analysis
        }
        
        // Boost priority based on risk score
        priority += impact.riskScore * 0.2;
        
        return Math.min(priority, 1.0);
    }
    
    /**
     * Calculate debounce delay based on file importance
     */
    calculateDebounceDelay(importance, impact) {
        const baseDelay = this.options.debounceDelay;
        
        // Reduce delay for important files
        const importanceMultiplier = 1 - (importance * 0.7);
        
        // Reduce delay for high-impact changes
        const impactMultiplier = 1 - (impact.riskScore * 0.3);
        
        return Math.max(baseDelay * importanceMultiplier * impactMultiplier, 500);
    }
    
    /**
     * Determine analysis scope based on change impact
     */
    determineAnalysisScope(analysisRequest) {
        const { filePath, impact, importance } = analysisRequest;
        
        const scope = {
            targetFile: filePath,
            includeDependents: false,
            includeTests: false,
            analysisDepth: 'file', // 'file', 'module', 'project'
            categories: ['all']
        };
        
        // Expand scope for important files or high-impact changes
        if (importance > 0.7 || impact.riskScore > 0.6) {
            scope.includeDependents = true;
            scope.analysisDepth = 'module';
        }
        
        // Include tests for high-importance changes
        if (importance > 0.8 || impact.affectedTests.size > 0) {
            scope.includeTests = true;
        }
        
        // Full project analysis for critical infrastructure changes
        if (importance >= 1.0 && filePath.match(/package\.json|tsconfig\.json|.*\.config\./)) {
            scope.analysisDepth = 'project';
        }
        
        return scope;
    }
    
    /**
     * Run targeted analysis based on scope
     */
    async runTargetedAnalysis(analysisRequest, scope) {
        const analysisData = {
            trigger: 'smart-file-change',
            filePath: analysisRequest.filePath,
            changeType: analysisRequest.changeType,
            priority: analysisRequest.priority,
            scope: scope,
            timestamp: Date.now()
        };
        
        // Emit analysis request to be handled by analysis engine
        this.emit('analysisTriggered', analysisData);
        
        // For demo purposes, simulate analysis delay
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    /**
     * Build project dependency graph for impact analysis
     */
    async buildDependencyGraph() {
        console.log('🔗 Building dependency graph...');
        
        // This would typically parse import/require statements
        // For now, we'll create a simplified version
        
        const commonDependencies = {
            'src/index.js': new Set(['src/App.js', 'src/utils/index.js']),
            'src/App.js': new Set(['src/components/Header.js', 'src/pages/Home.js']),
            'src/utils/index.js': new Set(['src/components/Button.js']),
            'package.json': new Set() // Critical file with no dependents in code
        };
        
        for (const [file, deps] of Object.entries(commonDependencies)) {
            this.dependencyGraph.set(file, deps);
        }
        
        console.log(`📊 Dependency graph built with ${this.dependencyGraph.size} nodes`);
    }
    
    /**
     * Calculate file importance scores for all tracked files
     */
    async calculateFileImportance() {
        console.log('⚖️ Calculating file importance scores...');
        
        // This would typically scan the project structure
        // For now, we'll set some example scores
        
        const exampleFiles = [
            'src/index.js',
            'src/App.js', 
            'src/components/Header.js',
            'src/utils/index.js',
            'package.json',
            'src/pages/Home.js'
        ];
        
        for (const file of exampleFiles) {
            this.getFileImportance(file); // This will calculate and cache the score
        }
        
        console.log(`📈 Calculated importance for ${this.fileImportance.size} files`);
    }
    
    /**
     * Calculate risk score for changes
     */
    calculateRiskScore(changeType, dependentCount, filePath) {
        let risk = 0;
        
        // Risk based on change type
        switch (changeType) {
            case 'deleted': risk += 0.8; break;
            case 'modified': risk += 0.3; break;
            case 'added': risk += 0.1; break;
        }
        
        // Risk based on dependent count
        risk += Math.min(dependentCount * 0.1, 0.5);
        
        // Risk based on file type
        if (filePath.match(/\.(config|json)$/)) {
            risk += 0.4; // Configuration changes are risky
        }
        
        return Math.min(risk, 1.0);
    }
    
    /**
     * Process next analysis request in queue
     */
    processNextInQueue() {
        if (this.analysisQueue.size === 0) return;
        
        // Find highest priority item in queue
        let highestPriority = 0;
        let nextRequest = null;
        
        for (const request of this.analysisQueue.values()) {
            if (request.priority > highestPriority) {
                highestPriority = request.priority;
                nextRequest = request;
            }
        }
        
        if (nextRequest && this.currentAnalysis.size < this.options.maxConcurrentAnalysis) {
            this.processAnalysisRequest(nextRequest);
        }
    }
    
    /**
     * Check if file exists
     */
    async fileExists(filePath) {
        try {
            const fs = await import('fs/promises');
            await fs.access(path.resolve(this.projectRoot, filePath));
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * Stop file watching and cleanup
     */
    async stop() {
        console.log('🛑 Stopping Smart Analysis Triggers...');
        
        if (this.fileWatcher) {
            await this.fileWatcher.close();
        }
        
        // Clear all timers
        for (const timer of this.debounceTimers.values()) {
            clearTimeout(timer);
        }
        
        this.debounceTimers.clear();
        this.analysisQueue.clear();
        this.currentAnalysis.clear();
        
        console.log('✅ Smart Analysis Triggers stopped');
    }
    
    /**
     * Get current trigger statistics
     */
    getStats() {
        return {
            watchedFiles: this.fileImportance.size,
            queuedAnalyses: this.analysisQueue.size,
            currentAnalyses: this.currentAnalysis.size,
            criticalFiles: Array.from(this.fileImportance.entries())
                .filter(([_, score]) => score >= 0.8).length,
            dependencyNodes: this.dependencyGraph.size
        };
    }
}

/**
 * Helper class for change impact analysis
 */
class ChangeImpactAnalyzer {
    constructor() {
        this.impactCache = new Map();
    }
    
    // Additional methods for sophisticated impact analysis would go here
}

export default SmartAnalysisTrigger;