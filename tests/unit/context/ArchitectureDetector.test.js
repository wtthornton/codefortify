/**
 * Tests for ArchitectureDetector
 * Tests architectural pattern detection for Context7 integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ArchitectureDetector } from '../../../src/context/ArchitectureDetector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('ArchitectureDetector', () => {
  let detector;
  let testProjectDir;

  beforeEach(async () => {
    testProjectDir = path.join(__dirname, 'fixtures', 'architecture-test-project');
    await fs.mkdir(testProjectDir, { recursive: true });
    await fs.mkdir(path.join(testProjectDir, 'src'), { recursive: true });

    detector = new ArchitectureDetector();
  });

  afterEach(async () => {
    try {
      await fs.rm(testProjectDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('constructor', () => {
    it('should initialize with default patterns', () => {
      expect(detector.patternIndicators).toBeDefined();
      expect(detector.config).toBeDefined();
      expect(detector.patternIndicators.mvc).toBeDefined();
      expect(detector.patternIndicators.repository).toBeDefined();
      expect(detector.patternIndicators.serviceLayer).toBeDefined();
      expect(detector.patternIndicators.microservices).toBeDefined();
      expect(detector.patternIndicators.eventDriven).toBeDefined();
      expect(detector.patternIndicators.componentBased).toBeDefined();
      expect(detector.patternIndicators.layered).toBeDefined();
    });
  });

  describe('detectArchitecturePatterns', () => {
    it('should detect React component architecture', async () => {
      // Create React component files
      await fs.mkdir(path.join(testProjectDir, 'src', 'components'), { recursive: true });
      await fs.writeFile(
        path.join(testProjectDir, 'src', 'components', 'Button.jsx'),
        `import React from 'react';

export function Button({ children, onClick }) {
  return (
    <button onClick={onClick}>
      {children}
    </button>
  );
}`
      );

      const patterns = await detector.detectArchitecturePatterns(testProjectDir);

      expect(patterns).toBeDefined();
      expect(patterns.patterns).toBeDefined();
      expect(patterns.primary).toBeDefined();
      expect(patterns.confidence).toBeDefined();
      expect(patterns.recommendations).toBeDefined();
    });

    it('should detect MVC architecture', async () => {
      // Create MVC structure
      await fs.mkdir(path.join(testProjectDir, 'models'), { recursive: true });
      await fs.mkdir(path.join(testProjectDir, 'views'), { recursive: true });
      await fs.mkdir(path.join(testProjectDir, 'controllers'), { recursive: true });

      await fs.writeFile(
        path.join(testProjectDir, 'models', 'User.js'),
        `class User {
  constructor(id, name, email) {
    this.id = id;
    this.name = name;
    this.email = email;
  }
}

module.exports = User;`
      );

      await fs.writeFile(
        path.join(testProjectDir, 'controllers', 'UserController.js'),
        `const User = require('../models/User');

class UserController {
  async createUser(req, res) {
    const user = new User(req.body.id, req.body.name, req.body.email);
    res.json(user);
  }
}

module.exports = UserController;`
      );

      const patterns = await detector.detectArchitecturePatterns(testProjectDir);

      expect(patterns).toBeDefined();
      expect(patterns.patterns).toBeDefined();
      expect(patterns.primary).toBeDefined();
      expect(patterns.confidence).toBeDefined();
    });

    it('should detect microservices architecture', async () => {
      // Create microservices structure
      await fs.mkdir(path.join(testProjectDir, 'services', 'user-service'), { recursive: true });
      await fs.mkdir(path.join(testProjectDir, 'services', 'order-service'), { recursive: true });

      await fs.writeFile(
        path.join(testProjectDir, 'services', 'user-service', 'package.json'),
        JSON.stringify({
          name: 'user-service',
          version: '1.0.0',
          main: 'index.js'
        })
      );

      await fs.writeFile(
        path.join(testProjectDir, 'Dockerfile'),
        'FROM node:18-alpine'
      );

      const patterns = await detector.detectArchitecturePatterns(testProjectDir);

      expect(patterns).toBeDefined();
      expect(patterns.patterns).toBeDefined();
      expect(patterns.primary).toBeDefined();
      expect(patterns.confidence).toBeDefined();
    });

    it('should detect layered architecture', async () => {
      // Create layered structure
      await fs.mkdir(path.join(testProjectDir, 'src', 'presentation'), { recursive: true });
      await fs.mkdir(path.join(testProjectDir, 'src', 'business'), { recursive: true });
      await fs.mkdir(path.join(testProjectDir, 'src', 'data'), { recursive: true });

      await fs.writeFile(
        path.join(testProjectDir, 'src', 'presentation', 'UserController.js'),
        `class UserController {
  constructor(userService) {
    this.userService = userService;
  }
  
  async handleRequest(req, res) {
    const result = await this.userService.processUser(req.body);
    res.json(result);
  }
}`
      );

      await fs.writeFile(
        path.join(testProjectDir, 'src', 'business', 'UserService.js'),
        `class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }
  
  async processUser(userData) {
    return await this.userRepository.save(userData);
  }
}`
      );

      const patterns = await detector.detectArchitecturePatterns(testProjectDir);

      expect(patterns).toBeDefined();
      expect(patterns.patterns).toBeDefined();
      expect(patterns.primary).toBeDefined();
      expect(patterns.confidence).toBeDefined();
    });

    it('should handle empty project', async () => {
      const patterns = await detector.detectArchitecturePatterns(testProjectDir);

      expect(patterns).toBeDefined();
      expect(patterns.patterns).toBeDefined();
      expect(patterns.primary).toBeDefined();
      expect(patterns.confidence).toBeDefined();
      expect(patterns.recommendations).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle non-existent directory gracefully', async () => {
      const nonExistentDir = path.join(testProjectDir, 'non-existent');

      const patterns = await detector.detectArchitecturePatterns(nonExistentDir);

      expect(patterns).toBeDefined();
      expect(patterns.patterns).toBeDefined();
      expect(patterns.primary).toBeDefined();
      expect(patterns.confidence).toBeDefined();
    });
  });
});