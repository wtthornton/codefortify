/**
 * Architecture Pattern Detector for Context7
 * Detects and analyzes architectural patterns in codebases
 *
 * Features:
 * - MVC pattern detection
 * - Repository pattern detection
 * - Service layer detection
 * - Microservices detection
 * - Event-driven architecture detection
 * - Component-based architecture detection
 */

import { fileUtils } from '../utils/fileUtils.js';
import path from 'path';

export class ArchitectureDetector {
  constructor(config = {}) {
    this.config = config;
    this.patternIndicators = {
      mvc: {
        directories: ['models', 'views', 'controllers', 'routes'],
        files: ['controller.js', 'model.js', 'view.js', 'route.js'],
        patterns: [/Controller/, /Model/, /View/, /Route/]
      },
      repository: {
        directories: ['repositories', 'data'],
        files: ['repository.js', 'data-access.js', 'dao.js'],
        patterns: [/Repository/, /DataAccess/, /DAO/]
      },
      serviceLayer: {
        directories: ['services', 'business'],
        files: ['service.js', 'business.js', 'logic.js'],
        patterns: [/Service/, /Business/, /Logic/]
      },
      microservices: {
        directories: ['services', 'microservices', 'api'],
        files: ['service.js', 'api.js', 'gateway.js'],
        patterns: [/Service/, /API/, /Gateway/]
      },
      eventDriven: {
        directories: ['events', 'handlers', 'listeners'],
        files: ['event.js', 'handler.js', 'listener.js'],
        patterns: [/Event/, /Handler/, /Listener/, /emit/, /on\(/]
      },
      componentBased: {
        directories: ['components', 'ui', 'widgets'],
        files: ['component.js', 'component.jsx', 'component.tsx'],
        patterns: [/Component/, /Props/, /State/]
      },
      layered: {
        directories: ['layers', 'presentation', 'business', 'data'],
        files: ['layer.js', 'presentation.js', 'business.js', 'data.js'],
        patterns: [/Layer/, /Presentation/, /Business/, /Data/]
      }
    };
  }

  /**
   * Detect architecture patterns in the project
   * @param {string} projectRoot - Root directory of the project
   * @returns {Promise<Object>} Architecture patterns with confidence scores
   */
  async detectArchitecturePatterns(projectRoot) {
    try {
      console.log(`🏗️ Detecting architecture patterns in: ${projectRoot}`);

      const patterns = {
        mvc: await this.detectMVC(projectRoot),
        repository: await this.detectRepository(projectRoot),
        serviceLayer: await this.detectServiceLayer(projectRoot),
        microservices: await this.detectMicroservices(projectRoot),
        eventDriven: await this.detectEventDriven(projectRoot),
        componentBased: await this.detectComponentBased(projectRoot),
        layered: await this.detectLayered(projectRoot)
      };

      const rankedPatterns = this.rankPatterns(patterns);
      const primaryPattern = this.identifyPrimaryPattern(rankedPatterns);

      return {
        patterns: rankedPatterns,
        primary: primaryPattern,
        confidence: this.calculateOverallConfidence(rankedPatterns),
        recommendations: await this.generateArchitectureRecommendations(rankedPatterns, projectRoot)
      };

    } catch (error) {
      console.error(`❌ Error detecting architecture patterns: ${error.message}`);
      return {
        patterns: {},
        primary: null,
        confidence: 0,
        recommendations: []
      };
    }
  }

  /**
   * Detect MVC (Model-View-Controller) pattern
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Object>} MVC pattern analysis
   */
  async detectMVC(projectRoot) {
    const indicators = this.patternIndicators.mvc;
    const matches = await this.scanForPatterns(projectRoot, indicators);

    const confidence = Math.min(matches.directories.length * 0.3 + matches.files.length * 0.2 + matches.patterns.length * 0.1, 1.0);

    return {
      confidence,
      indicators: matches,
      description: 'Model-View-Controller separation',
      benefits: ['Separation of concerns', 'Maintainability', 'Testability'],
      implementation: this.getMVCImplementationGuide()
    };
  }

  /**
   * Detect Repository pattern
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Object>} Repository pattern analysis
   */
  async detectRepository(projectRoot) {
    const indicators = this.patternIndicators.repository;
    const matches = await this.scanForPatterns(projectRoot, indicators);

    const confidence = Math.min(matches.directories.length * 0.4 + matches.files.length * 0.3 + matches.patterns.length * 0.2, 1.0);

    return {
      confidence,
      indicators: matches,
      description: 'Repository pattern for data access abstraction',
      benefits: ['Data access abstraction', 'Testability', 'Flexibility'],
      implementation: this.getRepositoryImplementationGuide()
    };
  }

  /**
   * Detect Service Layer pattern
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Object>} Service layer pattern analysis
   */
  async detectServiceLayer(projectRoot) {
    const indicators = this.patternIndicators.serviceLayer;
    const matches = await this.scanForPatterns(projectRoot, indicators);

    const confidence = Math.min(matches.directories.length * 0.4 + matches.files.length * 0.3 + matches.patterns.length * 0.2, 1.0);

    return {
      confidence,
      indicators: matches,
      description: 'Service layer for business logic separation',
      benefits: ['Business logic separation', 'Reusability', 'Maintainability'],
      implementation: this.getServiceLayerImplementationGuide()
    };
  }

  /**
   * Detect Microservices architecture
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Object>} Microservices pattern analysis
   */
  async detectMicroservices(projectRoot) {
    const indicators = this.patternIndicators.microservices;
    const matches = await this.scanForPatterns(projectRoot, indicators);

    // Additional microservices indicators
    const dockerFiles = await this.scanForFiles(projectRoot, ['Dockerfile', 'docker-compose.yml']);
    const apiFiles = await this.scanForFiles(projectRoot, ['api.js', 'gateway.js', 'service.js']);

    const confidence = Math.min(
      matches.directories.length * 0.2 +
      matches.files.length * 0.2 +
      matches.patterns.length * 0.1 +
      dockerFiles.length * 0.3 +
      apiFiles.length * 0.2,
      1.0
    );

    return {
      confidence,
      indicators: { ...matches, dockerFiles, apiFiles },
      description: 'Microservices architecture pattern',
      benefits: ['Scalability', 'Independence', 'Technology diversity'],
      implementation: this.getMicroservicesImplementationGuide()
    };
  }

  /**
   * Detect Event-driven architecture
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Object>} Event-driven pattern analysis
   */
  async detectEventDriven(projectRoot) {
    const indicators = this.patternIndicators.eventDriven;
    const matches = await this.scanForPatterns(projectRoot, indicators);

    // Additional event-driven indicators
    const eventFiles = await this.scanForFiles(projectRoot, ['event.js', 'handler.js', 'listener.js']);
    const eventPatterns = await this.scanForCodePatterns(projectRoot, [/emit\(/, /on\(/, /EventEmitter/]);

    const confidence = Math.min(
      matches.directories.length * 0.3 +
      matches.files.length * 0.2 +
      matches.patterns.length * 0.2 +
      eventFiles.length * 0.2 +
      eventPatterns.length * 0.1,
      1.0
    );

    return {
      confidence,
      indicators: { ...matches, eventFiles, eventPatterns },
      description: 'Event-driven architecture pattern',
      benefits: ['Loose coupling', 'Scalability', 'Responsiveness'],
      implementation: this.getEventDrivenImplementationGuide()
    };
  }

  /**
   * Detect Component-based architecture
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Object>} Component-based pattern analysis
   */
  async detectComponentBased(projectRoot) {
    const indicators = this.patternIndicators.componentBased;
    const matches = await this.scanForPatterns(projectRoot, indicators);

    // Additional component indicators
    const componentFiles = await this.scanForFiles(projectRoot, ['.jsx', '.tsx', '.vue']);
    const componentPatterns = await this.scanForCodePatterns(projectRoot, [/export default/, /function.*Component/, /class.*Component/]);

    const confidence = Math.min(
      matches.directories.length * 0.2 +
      matches.files.length * 0.2 +
      matches.patterns.length * 0.1 +
      componentFiles.length * 0.3 +
      componentPatterns.length * 0.2,
      1.0
    );

    return {
      confidence,
      indicators: { ...matches, componentFiles, componentPatterns },
      description: 'Component-based architecture pattern',
      benefits: ['Reusability', 'Maintainability', 'Modularity'],
      implementation: this.getComponentBasedImplementationGuide()
    };
  }

  /**
   * Detect Layered architecture
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Object>} Layered pattern analysis
   */
  async detectLayered(projectRoot) {
    const indicators = this.patternIndicators.layered;
    const matches = await this.scanForPatterns(projectRoot, indicators);

    const confidence = Math.min(matches.directories.length * 0.4 + matches.files.length * 0.3 + matches.patterns.length * 0.2, 1.0);

    return {
      confidence,
      indicators: matches,
      description: 'Layered architecture pattern',
      benefits: ['Separation of concerns', 'Maintainability', 'Testability'],
      implementation: this.getLayeredImplementationGuide()
    };
  }

  // Private methods

  async scanForPatterns(projectRoot, indicators) {
    const results = {
      directories: [],
      files: [],
      patterns: []
    };

    try {
      // Scan for directories
      for (const dir of indicators.directories) {
        const dirPath = path.join(projectRoot, dir);
        if (await fileUtils.directoryExists(dirPath)) {
          results.directories.push(dir);
        }
      }

      // Scan for files
      for (const file of indicators.files) {
        const files = await this.scanForFiles(projectRoot, [file]);
        results.files.push(...files);
      }

      // Scan for code patterns
      for (const pattern of indicators.patterns) {
        const matches = await this.scanForCodePatterns(projectRoot, [pattern]);
        results.patterns.push(...matches);
      }

    } catch (error) {
      console.error(`Error scanning for patterns: ${error.message}`);
    }

    return results;
  }

  async scanForFiles(projectRoot, filePatterns) {
    const files = [];

    try {
      const allFiles = await fileUtils.getAllFiles(projectRoot);

      for (const file of allFiles) {
        for (const pattern of filePatterns) {
          if (file.includes(pattern) || file.endsWith(pattern)) {
            files.push(file);
            break;
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning for files: ${error.message}`);
    }

    return files;
  }

  async scanForCodePatterns(projectRoot, patterns) {
    const matches = [];

    try {
      const jsFiles = await fileUtils.getFilesByExtension(projectRoot, ['.js', '.jsx', '.ts', '.tsx']);

      for (const file of jsFiles) {
        try {
          const content = await fileUtils.readFile(file);

          for (const pattern of patterns) {
            if (pattern.test(content)) {
              matches.push({
                file,
                pattern: pattern.toString(),
                matches: content.match(pattern)?.length || 0
              });
            }
          }
        } catch (error) {
          // Skip files that can't be read
          continue;
        }
      }
    } catch (error) {
      console.error(`Error scanning for code patterns: ${error.message}`);
    }

    return matches;
  }

  rankPatterns(patterns) {
    return Object.entries(patterns)
      .map(([name, pattern]) => ({ name, ...pattern }))
      .sort((a, b) => b.confidence - a.confidence);
  }

  identifyPrimaryPattern(rankedPatterns) {
    if (rankedPatterns.length === 0) {return null;}

    const topPattern = rankedPatterns[0];
    return topPattern.confidence > 0.5 ? topPattern : null;
  }

  calculateOverallConfidence(rankedPatterns) {
    if (rankedPatterns.length === 0) {return 0;}

    const topPattern = rankedPatterns[0];
    return topPattern.confidence;
  }

  async generateArchitectureRecommendations(patterns, projectRoot) {
    const recommendations = [];

    // Check for missing patterns
    const lowConfidencePatterns = patterns.filter(p => p.confidence < 0.3);

    for (const pattern of lowConfidencePatterns) {
      recommendations.push({
        type: 'architecture',
        pattern: pattern.name,
        recommendation: `Consider implementing ${pattern.description}`,
        benefits: pattern.benefits,
        implementation: pattern.implementation
      });
    }

    // Check for mixed patterns
    const highConfidencePatterns = patterns.filter(p => p.confidence > 0.7);
    if (highConfidencePatterns.length > 1) {
      recommendations.push({
        type: 'architecture',
        pattern: 'mixed',
        recommendation: 'Consider consolidating architecture patterns for consistency',
        benefits: ['Consistency', 'Maintainability', 'Team alignment'],
        implementation: 'Choose one primary pattern and refactor accordingly'
      });
    }

    return recommendations;
  }

  getMVCImplementationGuide() {
    return {
      structure: {
        models: 'Business logic and data models',
        views: 'Presentation layer and UI components',
        controllers: 'Request handling and coordination'
      },
      examples: [
        'models/User.js - User data model',
        'views/UserView.jsx - User interface component',
        'controllers/UserController.js - User request handling'
      ]
    };
  }

  getRepositoryImplementationGuide() {
    return {
      structure: {
        repositories: 'Data access layer',
        interfaces: 'Repository contracts',
        implementations: 'Concrete repository implementations'
      },
      examples: [
        'repositories/UserRepository.js - User data access',
        'repositories/ProductRepository.js - Product data access'
      ]
    };
  }

  getServiceLayerImplementationGuide() {
    return {
      structure: {
        services: 'Business logic layer',
        interfaces: 'Service contracts',
        implementations: 'Concrete service implementations'
      },
      examples: [
        'services/UserService.js - User business logic',
        'services/OrderService.js - Order business logic'
      ]
    };
  }

  getMicroservicesImplementationGuide() {
    return {
      structure: {
        services: 'Individual microservices',
        api: 'API gateway and routing',
        shared: 'Shared libraries and utilities'
      },
      examples: [
        'services/user-service/ - User microservice',
        'services/order-service/ - Order microservice',
        'api/gateway.js - API gateway'
      ]
    };
  }

  getEventDrivenImplementationGuide() {
    return {
      structure: {
        events: 'Event definitions',
        handlers: 'Event handlers',
        listeners: 'Event listeners'
      },
      examples: [
        'events/UserCreated.js - User creation event',
        'handlers/UserCreatedHandler.js - Event handler',
        'listeners/UserListener.js - Event listener'
      ]
    };
  }

  getComponentBasedImplementationGuide() {
    return {
      structure: {
        components: 'Reusable UI components',
        pages: 'Page-level components',
        layouts: 'Layout components'
      },
      examples: [
        'components/Button.jsx - Reusable button component',
        'components/Header.jsx - Header component',
        'pages/HomePage.jsx - Home page component'
      ]
    };
  }

  getLayeredImplementationGuide() {
    return {
      structure: {
        presentation: 'UI and presentation layer',
        business: 'Business logic layer',
        data: 'Data access layer'
      },
      examples: [
        'presentation/UserInterface.jsx - UI layer',
        'business/UserBusiness.js - Business logic',
        'data/UserData.js - Data access'
      ]
    };
  }
}
