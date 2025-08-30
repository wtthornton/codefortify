/**
 * NodePatterns - Node.js-specific code patterns
 */

export class NodePatterns {
  static getServicePattern() {
    return `// Context7 Node.js Service Pattern
import { z } from 'zod';

const ServiceConfigSchema = z.object({
  apiKey: z.string(),
  baseUrl: z.string().url(),
  timeout: z.number().positive(),
});

/** AI ASSISTANT CONTEXT: Node.js service with dependency injection and error handling */
export class ExampleService {
  constructor(config) {
    this.config = ServiceConfigSchema.parse(config);
  }

  /** AI ASSISTANT CONTEXT: Async operation with proper error handling */
  async processData(input) {
    try {
      // Validate input
      const validatedInput = this.validateInput(input);
      
      // Process data
      const result = await this.performOperation(validatedInput);
      
      return result;
    } catch (error) {
      throw new Error(\`Service operation failed: \${error.message}\`);
    }
  }

  validateInput(input) {
    // Add input validation logic
    return input;
  }

  async performOperation(data) {
    // Implement business logic
    return data;
  }
}`;
  }

  static getMiddlewarePattern() {
    return `// Context7 Express Middleware Pattern
/** AI ASSISTANT CONTEXT: Express middleware with proper error handling */
export const exampleMiddleware = (options = {}) => {
  return async (req, res, next) => {
    try {
      // Middleware logic here
      const startTime = Date.now();
      
      // Add request metadata
      req.metadata = {
        timestamp: startTime,
        requestId: generateRequestId(),
      };

      // Continue to next middleware
      next();
      
      // Log request completion
      const duration = Date.now() - startTime;
      console.log(\`Request completed in \${duration}ms\`);
      
    } catch (error) {
      // Handle middleware errors
      console.error('Middleware error:', error);
      next(error);
    }
  };
};

function generateRequestId() {
  return Math.random().toString(36).substring(2, 15);
}`;
  }

  static getRoutePattern() {
    return `// Context7 Express Route Pattern
import express from 'express';
import { z } from 'zod';

const router = express.Router();

// Request validation schemas
const CreateItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

/** AI ASSISTANT CONTEXT: RESTful route with validation and error handling */
router.post('/items', async (req, res, next) => {
  try {
    // Validate request body
    const validatedData = CreateItemSchema.parse(req.body);
    
    // Business logic
    const newItem = await itemService.create(validatedData);
    
    // Return success response
    res.status(201).json({
      success: true,
      data: newItem,
      message: 'Item created successfully',
    });
    
  } catch (error) {
    // Handle validation and business logic errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    next(error);
  }
});

export default router;`;
  }

  static getTestPattern() {
    return `// Context7 Node.js Test Pattern
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { ExampleService } from './ExampleService.js';

/** AI ASSISTANT CONTEXT: Node.js API testing with proper setup/teardown */
describe('Example API', () => {
  let service;

  beforeEach(async () => {
    service = new ExampleService({
      apiKey: 'test-key',
      baseUrl: 'http://localhost:3000',
      timeout: 5000,
    });
    
    // Setup test database or mocks
    await setupTestEnvironment();
  });

  afterEach(async () => {
    // Cleanup after each test
    await cleanupTestEnvironment();
  });

  describe('POST /items', () => {
    it('should create item with valid data', async () => {
      const itemData = {
        name: 'Test Item',
        description: 'Test description',
        tags: ['test', 'item'],
      };

      const response = await request(app)
        .post('/items')
        .send(itemData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(itemData.name);
    });
  });

  describe('ExampleService', () => {
    it('should process data successfully', async () => {
      const input = { test: 'data' };
      const result = await service.processData(input);
      
      expect(result).toBeDefined();
    });
  });
});

async function setupTestEnvironment() {
  // Initialize test database, create test data, etc.
}

async function cleanupTestEnvironment() {
  // Clean up test data, close connections, etc.
}`;
  }
}