/**
 * Quality-Aware IntelliSense Provider
 * Enhances VS Code's IntelliSense with quality-focused suggestions
 */

import { EventEmitter } from 'events';

export class QualityIntelliSense extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.qualityPatterns = {
            // Security-first patterns
            security: {
                'fetch(': {
                    suggestion: 'secure fetch with error handling',
                    template: 'try {\n  const response = await fetch(${url}, {\n    headers: { "Content-Type": "application/json" }\n  });\n  if (!response.ok) throw new Error(`HTTP ${response.status}`);\n  const data = await response.json();\n  return data;\n} catch (error) {\n  console.error("Fetch error:", error);\n  throw error;\n}',
                    score: 8.5,
                    category: 'security'
                },
                'innerHTML': {
                    suggestion: 'textContent (XSS safe)',
                    template: 'textContent = ${content}',
                    warning: '⚠️ innerHTML can lead to XSS vulnerabilities',
                    score: 9.2,
                    category: 'security'
                }
            },
            
            // Performance patterns
            performance: {
                'import ': {
                    suggestions: [
                        {
                            suggestion: 'dynamic import for code splitting',
                            template: 'const ${module} = await import("${path}");',
                            score: 8.8,
                            bundleImpact: -15
                        },
                        {
                            suggestion: 'tree-shakable named import',
                            template: 'import { ${specifier} } from "${path}";',
                            score: 8.2,
                            bundleImpact: -5
                        }
                    ]
                },
                '.map(': {
                    suggestion: 'consider useMemo for expensive operations',
                    template: 'const ${resultName} = useMemo(() => {\n  return ${array}.map(${mapper});\n}, [${dependencies}]);',
                    score: 8.0,
                    category: 'performance',
                    framework: 'react'
                }
            },
            
            // Quality patterns
            quality: {
                'function ': {
                    suggestion: 'documented function with JSDoc',
                    template: '/**\n * ${description}\n * @param {${paramType}} ${paramName} - ${paramDesc}\n * @returns {${returnType}} ${returnDesc}\n */\nfunction ${functionName}(${parameters}) {\n  ${body}\n}',
                    score: 8.7,
                    category: 'quality'
                },
                '.then(': {
                    suggestion: 'async/await for better readability',
                    template: 'try {\n  const result = await ${promise};\n  ${successHandler}\n} catch (error) {\n  ${errorHandler}\n}',
                    score: 9.1,
                    category: 'quality'
                }
            }
        };
        
        this.frameworkContext = null;
        this.projectContext = null;
        this.currentQualityScore = 0;
    }
    
    /**
     * Initialize IntelliSense provider with project context
     */
    async initialize(projectContext) {
        this.projectContext = projectContext;
        this.frameworkContext = await this.detectFramework(projectContext);
        
        console.log(`🧠 Quality-Aware IntelliSense initialized for ${this.frameworkContext?.name || 'generic'} project`);
        
        this.emit('initialized', {
            framework: this.frameworkContext,
            patterns: Object.keys(this.qualityPatterns).length
        });
    }
    
    /**
     * Provide quality-enhanced completions
     */
    provideCompletionItems(document, position, context) {
        const line = document.lineAt(position).text;
        const prefix = line.substring(0, position.character);
        
        const suggestions = [];
        
        // Check all quality patterns
        for (const [category, patterns] of Object.entries(this.qualityPatterns)) {
            for (const [trigger, pattern] of Object.entries(patterns)) {
                if (prefix.includes(trigger) || prefix.endsWith(trigger.substring(0, -1))) {
                    if (Array.isArray(pattern)) {
                        suggestions.push(...pattern.map(p => this.createCompletionItem(p, category)));
                    } else {
                        suggestions.push(this.createCompletionItem(pattern, category));
                    }
                }
            }
        }
        
        // Framework-specific suggestions
        if (this.frameworkContext) {
            const frameworkSuggestions = this.getFrameworkSuggestions(prefix, this.frameworkContext);
            suggestions.push(...frameworkSuggestions);
        }
        
        // Sort by quality score
        return suggestions.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
    }
    
    /**
     * Create completion item with quality metadata
     */
    createCompletionItem(pattern, category) {
        return {
            label: pattern.suggestion,
            detail: `CodeFortify: ${pattern.score}/10 Quality Score`,
            documentation: {
                kind: 'markdown',
                value: this.createDocumentation(pattern, category)
            },
            insertText: pattern.template,
            insertTextFormat: 2, // Snippet format
            kind: this.getCompletionKind(category),
            qualityScore: pattern.score,
            category: category,
            bundleImpact: pattern.bundleImpact,
            sortText: `00${Math.round((10 - pattern.score) * 10)}`, // Higher quality = higher priority
            additionalTextEdits: pattern.imports ? this.createImports(pattern.imports) : undefined
        };
    }
    
    /**
     * Generate rich documentation for suggestions
     */
    createDocumentation(pattern, category) {
        let doc = `### 🎯 Quality Enhancement\n\n`;
        
        doc += `**Score**: ${pattern.score}/10\n`;
        doc += `**Category**: ${category}\n\n`;
        
        if (pattern.warning) {
            doc += `⚠️ **Warning**: ${pattern.warning}\n\n`;
        }
        
        if (pattern.bundleImpact) {
            const impact = pattern.bundleImpact > 0 ? `+${pattern.bundleImpact}KB` : `${pattern.bundleImpact}KB`;
            const emoji = pattern.bundleImpact > 0 ? '📈' : '📉';
            doc += `${emoji} **Bundle Impact**: ${impact}\n\n`;
        }
        
        if (pattern.benefits) {
            doc += `**Benefits**:\n${pattern.benefits.map(b => `- ${b}`).join('\n')}\n\n`;
        }
        
        doc += `**Example**:\n\`\`\`javascript\n${pattern.template}\n\`\`\``;
        
        return doc;
    }
    
    /**
     * Detect project framework and context
     */
    async detectFramework(projectContext) {
        const packageJson = projectContext.packageJson;
        
        if (packageJson.dependencies?.react || packageJson.devDependencies?.react) {
            return {
                name: 'react',
                version: packageJson.dependencies?.react || packageJson.devDependencies?.react,
                patterns: this.getReactPatterns()
            };
        }
        
        if (packageJson.dependencies?.vue || packageJson.devDependencies?.vue) {
            return {
                name: 'vue',
                version: packageJson.dependencies?.vue || packageJson.devDependencies?.vue,
                patterns: this.getVuePatterns()
            };
        }
        
        if (packageJson.dependencies?.express) {
            return {
                name: 'express',
                version: packageJson.dependencies.express,
                patterns: this.getExpressPatterns()
            };
        }
        
        return { name: 'javascript', patterns: {} };
    }
    
    /**
     * React-specific quality patterns
     */
    getReactPatterns() {
        return {
            'useState(': {
                suggestion: 'useState with descriptive name',
                template: 'const [${stateName}, set${StateName}] = useState(${initialValue});',
                score: 8.5,
                benefits: ['Clear naming convention', 'Better readability', 'Easier debugging']
            },
            'useEffect(': {
                suggestion: 'useEffect with dependency array',
                template: 'useEffect(() => {\n  ${effectBody}\n  \n  return () => {\n    ${cleanup}\n  };\n}, [${dependencies}]);',
                score: 9.0,
                benefits: ['Prevents infinite loops', 'Proper cleanup', 'Optimized re-renders']
            },
            '.map(item => ': {
                suggestion: 'map with key prop',
                template: '.map((${item}, index) => (\n  <${Component} key={${item}.id || index} ${props} />\n))',
                score: 8.8,
                benefits: ['React reconciliation optimization', 'Prevents rendering issues']
            }
        };
    }
    
    /**
     * Vue-specific quality patterns
     */
    getVuePatterns() {
        return {
            'ref(': {
                suggestion: 'reactive reference with type',
                template: 'const ${refName} = ref<${Type}>(${initialValue});',
                score: 8.6,
                benefits: ['Type safety', 'Better IDE support', 'Runtime type checking']
            },
            'computed(': {
                suggestion: 'computed with dependencies',
                template: 'const ${computedName} = computed(() => {\n  return ${computation}\n});',
                score: 8.4,
                benefits: ['Automatic dependency tracking', 'Cached computation', 'Reactive updates']
            }
        };
    }
    
    /**
     * Express/Node.js-specific quality patterns
     */
    getExpressPatterns() {
        return {
            'app.get(': {
                suggestion: 'route with error handling',
                template: 'app.get("${path}", async (req, res, next) => {\n  try {\n    ${routeLogic}\n    res.json(${response});\n  } catch (error) {\n    next(error);\n  }\n});',
                score: 9.2,
                benefits: ['Proper error handling', 'Async/await pattern', 'Express error middleware']
            },
            'req.body': {
                suggestion: 'validated request body',
                template: 'const ${bodyName} = await validateSchema(req.body, ${schemaName});',
                score: 9.0,
                warning: 'Always validate user input for security',
                benefits: ['Input validation', 'Security protection', 'Type safety']
            }
        };
    }
    
    /**
     * Get framework-specific suggestions based on context
     */
    getFrameworkSuggestions(prefix, framework) {
        if (!framework.patterns) return [];
        
        const suggestions = [];
        
        for (const [trigger, pattern] of Object.entries(framework.patterns)) {
            if (prefix.includes(trigger)) {
                suggestions.push({
                    ...this.createCompletionItem(pattern, framework.name),
                    detail: `${framework.name.toUpperCase()}: ${pattern.suggestion}`
                });
            }
        }
        
        return suggestions;
    }
    
    /**
     * Get appropriate completion kind based on category
     */
    getCompletionKind(category) {
        const kindMap = {
            security: 17, // Security
            performance: 15, // Optimization
            quality: 14, // Enhancement
            react: 7, // Component
            vue: 7, // Component
            express: 13 // Function
        };
        
        return kindMap[category] || 1; // Default: Text
    }
    
    /**
     * Update quality score context for better suggestions
     */
    updateQualityContext(qualityScore, categoryScores) {
        this.currentQualityScore = qualityScore;
        
        // Adjust suggestion priorities based on current weak areas
        const weakCategories = Object.entries(categoryScores)
            .filter(([_, score]) => score < 70)
            .map(([category]) => category);
            
        // Boost suggestions for weak categories
        for (const category of weakCategories) {
            if (this.qualityPatterns[category]) {
                for (const pattern of Object.values(this.qualityPatterns[category])) {
                    if (typeof pattern === 'object' && pattern.score) {
                        pattern.score += 0.5; // Slight boost for needed improvements
                    }
                }
            }
        }
        
        this.emit('qualityContextUpdated', { qualityScore, weakCategories });
    }
    
    /**
     * Learn from accepted suggestions to improve recommendations
     */
    onSuggestionAccepted(suggestion, context) {
        console.log(`✅ Quality suggestion accepted: ${suggestion.label}`);
        
        // Track successful patterns
        this.emit('suggestionAccepted', {
            pattern: suggestion.label,
            category: suggestion.category,
            score: suggestion.qualityScore,
            context: context
        });
        
        // TODO: Machine learning to improve suggestion relevance
    }
    
    /**
     * Provide hover information with quality insights
     */
    provideHover(document, position) {
        const range = document.getWordRangeAtPosition(position);
        const word = document.getText(range);
        
        // Check if word matches any quality pattern
        for (const [category, patterns] of Object.entries(this.qualityPatterns)) {
            for (const [trigger, pattern] of Object.entries(patterns)) {
                if (trigger.includes(word)) {
                    return {
                        contents: [
                            `### CodeFortify Quality Insight`,
                            `**Pattern**: ${pattern.suggestion}`,
                            `**Score**: ${pattern.score}/10`,
                            pattern.warning ? `⚠️ ${pattern.warning}` : '',
                            `**Category**: ${category}`
                        ].filter(Boolean).join('\n\n')
                    };
                }
            }
        }
        
        return null;
    }
}

export default QualityIntelliSense;