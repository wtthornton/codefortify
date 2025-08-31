/**
 * PatternProvider - Generates Context7-compliant code patterns
 *
 * Provides framework-specific code patterns and scaffolding
 * based on project type and configuration.
 */

export class PatternProvider {
  constructor(config) {
    this.config = config;
  }

  async generatePatterns() {
    try {
      console.error(`PatternProvider: Generating patterns for ${this.config.projectType}`);
      const framework = this.config.projectType;

      let patterns;
      switch (framework) {
      case 'react-webapp':
        patterns = this.getReactPatterns();
        break;
      case 'vue-webapp':
        patterns = this.getVuePatterns();
        break;
      case 'svelte-webapp':
        patterns = this.getSveltePatterns();
        break;
      case 'node-api':
        patterns = this.getNodePatterns();
        break;
      default:
        patterns = this.getJavaScriptPatterns();
      }

      console.error('PatternProvider: Patterns generated successfully');
      return patterns;
    } catch (error) {
      console.error('PatternProvider: Pattern generation failed:', error.message);
      throw new Error(`Pattern generation failed: ${error.message}`);
    }
  }

  async getPattern(patternType, framework = this.config.projectType) {
    try {
      console.error(`PatternProvider: Getting pattern ${patternType} for ${framework}`);

      const patterns = {
        react: {
          component: () => this.getReactComponentPattern(),
          hook: () => this.getReactHookPattern(),
          service: () => this.getServicePattern(),
          test: () => this.getReactTestPattern()
        },
        vue: {
          component: () => this.getVueComponentPattern(),
          service: () => this.getServicePattern(),
          test: () => this.getVueTestPattern()
        },
        node: {
          service: () => this.getNodeServicePattern(),
          middleware: () => this.getMiddlewarePattern(),
          route: () => this.getRoutePattern(),
          test: () => this.getNodeTestPattern()
        },
        javascript: {
          class: () => this.getJavaScriptClassPattern(),
          function: () => this.getJavaScriptFunctionPattern(),
          test: () => this.getJavaScriptTestPattern()
        }
      };

      const frameworkKey = framework.split('-')[0]; // react-webapp -> react
      const frameworkPatterns = patterns[frameworkKey] || patterns.javascript;
      const patternGenerator = frameworkPatterns[patternType];

      if (!patternGenerator) {
        return `Pattern '${patternType}' not found for framework '${framework}'. Available patterns: ${Object.keys(frameworkPatterns).join(', ')}`;
      }

      const result = patternGenerator();
      console.error('PatternProvider: Pattern retrieved successfully');
      return result;
    } catch (error) {
      console.error('PatternProvider: Pattern retrieval failed:', error.message);
      throw new Error(`Pattern retrieval failed: ${error.message}`);
    }
  }

  getReactPatterns() {
    return `// Context7 React Patterns for ${this.config.projectName}

${this.getReactComponentPattern()}

${this.getReactHookPattern()}

${this.getServicePattern()}`;
  }

  getReactComponentPattern() {
    return `// Context7 React Component Pattern
import React from 'react';
import { useQuery } from '@tanstack/react-query';

interface ComponentProps {
  /** AI ASSISTANT CONTEXT: Component props description */
  title: string;
  data?: any[];
  className?: string;
}

/** AI ASSISTANT CONTEXT: Describe the component's purpose and usage */
export const ExampleComponent: React.FC<ComponentProps> = ({ 
  title, 
  data, 
  className = '' 
}) => {
  /** AI ASSISTANT CONTEXT: Custom hook for data fetching */
  const { data: queryData, isLoading, error } = useQuery({
    queryKey: ['example', title],
    queryFn: () => fetchExampleData(title),
    enabled: !!title,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className={\`p-4 bg-white rounded-lg shadow-sm \${className}\`}>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
      {queryData && (
        <div className="space-y-2">
          {queryData.map((item, index) => (
            <div key={item.id || index} className="p-2 bg-gray-50 rounded">
              {/* Render your data */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Default export for lazy loading
export default ExampleComponent;`;
  }

  getReactHookPattern() {
    return `// Context7 Custom Hook Pattern
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useEffect } from 'react';

interface UseExampleDataOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

/** AI ASSISTANT CONTEXT: Custom hook for data management with caching and optimistic updates */
export const useExampleData = (id: string, options: UseExampleDataOptions = {}) => {
  const queryClient = useQueryClient();
  const [localState, setLocalState] = useState<any>(null);

  // Data fetching query
  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['example-data', id],
    queryFn: () => fetchData(id),
    enabled: !!id && (options.enabled ?? true),
    refetchInterval: options.refetchInterval,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation for updates
  const updateMutation = useMutation({
    mutationFn: (updateData: any) => updateData(id, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['example-data', id] });
    },
    onError: (error) => {
      console.error('Update failed:', error);
    },
  });

  // Process data when it changes
  useEffect(() => {
    if (data) {
      const processed = processData(data);
      setLocalState(processed);
    }
  }, [data]);

  // Memoized update function
  const updateData = useCallback(async (updates: any) => {
    try {
      await updateMutation.mutateAsync(updates);
    } catch (error) {
      throw new Error(\`Failed to update data: \${error.message}\`);
    }
  }, [updateMutation]);

  return {
    data: localState,
    isLoading,
    isFetching,
    error,
    refetch,
    updateData,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
};

// Helper function (can be extracted to utils)
function processData(rawData: any) {
  // Process and transform data as needed
  return rawData;
}`;
  }

  getServicePattern() {
    return `// Context7 Service Pattern
import { z } from 'zod';

// Validation schemas
const ApiResponseSchema = z.object({
  data: z.any(),
  status: z.string(),
  message: z.string().optional(),
});

const FetchParamsSchema = z.object({
  id: z.string(),
  filters: z.record(z.any()).optional(),
});

type FetchParams = z.infer<typeof FetchParamsSchema>;
type ApiResponse = z.infer<typeof ApiResponseSchema>;

/** AI ASSISTANT CONTEXT: Service for API interactions with validation and error handling */
export class ExampleService {
  private static instance: ExampleService;
  private baseUrl: string;
  private headers: Record<string, string>;

  private constructor() {
    this.baseUrl = process.env.VITE_API_URL || 'http://localhost:3000';
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  static getInstance(): ExampleService {
    if (!ExampleService.instance) {
      ExampleService.instance = new ExampleService();
    }
    return ExampleService.instance;
  }

  /** AI ASSISTANT CONTEXT: Fetch data with validation and error handling */
  async fetchData(params: FetchParams): Promise<ApiResponse> {
    try {
      // Validate input parameters
      const validatedParams = FetchParamsSchema.parse(params);
      
      const response = await fetch(\`\${this.baseUrl}/api/data\`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(validatedParams),
      });

      if (!response.ok) {
        throw new Error(\`API request failed: \${response.status} \${response.statusText}\`);
      }

      const data = await response.json();
      
      // Validate response
      return ApiResponseSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(\`Validation error: \${error.message}\`);
      }
      throw new Error(\`Service error: \${error.message}\`);
    }
  }

  /** AI ASSISTANT CONTEXT: Update data with optimistic updates */
  async updateData(id: string, updateData: any): Promise<ApiResponse> {
    try {
      const response = await fetch(\`\${this.baseUrl}/api/data/\${id}\`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(\`Update failed: \${response.status} \${response.statusText}\`);
      }

      const data = await response.json();
      return ApiResponseSchema.parse(data);
    } catch (error) {
      throw new Error(\`Update service error: \${error.message}\`);
    }
  }
}

// Export singleton instance
export const exampleService = ExampleService.getInstance();`;
  }

  getReactTestPattern() {
    return `// Context7 React Testing Pattern
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ExampleComponent } from './ExampleComponent';

// Mock the service
vi.mock('../services/exampleService', () => ({
  fetchExampleData: vi.fn(),
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('ExampleComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    renderWithQueryClient(<ExampleComponent title="Test Title" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render error state when fetch fails', async () => {
    const mockError = new Error('Fetch failed');
    vi.mocked(fetchExampleData).mockRejectedValue(mockError);

    renderWithQueryClient(<ExampleComponent title="Test Title" />);
    
    await waitFor(() => {
      expect(screen.getByText(/Error: Fetch failed/i)).toBeInTheDocument();
    });
  });

  it('should render data when fetch succeeds', async () => {
    const mockData = [{ id: 1, name: 'Test Item' }];
    vi.mocked(fetchExampleData).mockResolvedValue(mockData);

    renderWithQueryClient(<ExampleComponent title="Test Title" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });
  });

  it('should handle user interactions', async () => {
    const mockData = [{ id: 1, name: 'Test Item' }];
    vi.mocked(fetchExampleData).mockResolvedValue(mockData);

    renderWithQueryClient(<ExampleComponent title="Test Title" />);
    
    await waitFor(() => {
      const button = screen.getByRole('button');
      fireEvent.click(button);
      // Add assertions for interaction behavior
    });
  });
});`;
  }

  getSveltePatterns() {
    return `// Context7 Svelte Patterns for ${this.config.projectName}
// Svelte patterns would be implemented here
export default 'Svelte patterns placeholder';
`;
  }

  // Vue patterns
  getVuePatterns() {
    return `// Context7 Vue Patterns for ${this.config.projectName}

${this.getVueComponentPattern()}

${this.getServicePattern()}

${this.getRoutePattern()}`;
  }

  getVueComponentPattern() {
    return `<!-- Context7 Vue Component Pattern -->
<template>
  <div class="p-4 bg-white rounded-lg shadow-sm">
    <h2 class="text-xl font-semibold text-gray-900 mb-4">{{ title }}</h2>
    <div v-if="loading" class="flex items-center justify-center p-4">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
    <div v-else-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-red-600">Error: {{ error.message }}</p>
    </div>
    <div v-else class="space-y-2">
      <!-- Component content -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuery } from '@tanstack/vue-query';

interface Props {
  title: string;
  data?: any[];
}

const props = defineProps<Props>();

// AI ASSISTANT CONTEXT: Data fetching with Vue Query
const { data, loading, error } = useQuery({
  queryKey: ['example', props.title],
  queryFn: () => fetchExampleData(props.title),
  enabled: computed(() => !!props.title),
});
</script>`;
  }

  getNodePatterns() {
    return `// Context7 Node.js Patterns for ${this.config.projectName}

${this.getNodeServicePattern()}

${this.getMiddlewarePattern()}

${this.getRoutePattern()}`;
  }

  getNodeServicePattern() {
    return `// Context7 Node.js Service Pattern
import { z } from 'zod';

const ServiceConfigSchema = z.object({
  apiKey: z.string(),
  baseUrl: z.string().url(),
  timeout: z.number().positive(),
});

/** AI ASSISTANT CONTEXT: Node.js service with dependency injection and error handling */
export class ExampleService {
  private config: z.infer<typeof ServiceConfigSchema>;

  constructor(config: unknown) {
    this.config = ServiceConfigSchema.parse(config);
  }

  /** AI ASSISTANT CONTEXT: Async operation with proper error handling */
  async processData(input: unknown): Promise<any> {
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

  private validateInput(input: unknown): any {
    // Add input validation logic
    return input;
  }

  private async performOperation(data: any): Promise<any> {
    // Implement business logic
    return data;
  }
}`;
  }

  getMiddlewarePattern() {
    return `// Context7 Express Middleware Pattern
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/** AI ASSISTANT CONTEXT: Express middleware with validation and error handling */
export const exampleMiddleware = (options: { requireAuth?: boolean } = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Middleware logic here
      if (options.requireAuth) {
        // Authentication check
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return res.status(401).json({ error: 'Authentication required' });
        }
      }

      // Validation logic
      if (req.body) {
        // Validate request body if needed
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};`;
  }

  getRoutePattern() {
    return `// Context7 Express Route Pattern
import { Router, Request, Response } from 'express';
import { z } from 'zod';

const router = Router();

// Request/Response schemas
const CreateItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const ItemParamsSchema = z.object({
  id: z.string().uuid(),
});

/** AI ASSISTANT CONTEXT: RESTful route with validation and error handling */
router.post('/items', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = CreateItemSchema.parse(req.body);
    
    // Business logic
    const newItem = await createItem(validatedData);
    
    res.status(201).json({
      success: true,
      data: newItem,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

router.get('/items/:id', async (req: Request, res: Response) => {
  try {
    const { id } = ItemParamsSchema.parse(req.params);
    
    const item = await findItemById(id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found',
      });
    }
    
    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    // Error handling
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;`;
  }

  getJavaScriptPatterns() {
    return `// Context7 JavaScript Patterns for ${this.config.projectName}

${this.getJavaScriptClassPattern()}

${this.getJavaScriptFunctionPattern()}`;
  }

  getJavaScriptClassPattern() {
    return `// Context7 JavaScript Class Pattern
export class ExampleClass {
  constructor(config = {}) {
    this.config = {
      defaultValue: 'default',
      ...config
    };
  }

  /** AI ASSISTANT CONTEXT: Main operation method with error handling */
  async performOperation(input) {
    try {
      this.validateInput(input);
      const result = await this.processInput(input);
      return this.formatOutput(result);
    } catch (error) {
      throw new Error(\`Operation failed: \${error.message}\`);
    }
  }

  validateInput(input) {
    if (!input) {
      throw new Error('Input is required');
    }
  }

  async processInput(input) {
    // Processing logic
    return input;
  }

  formatOutput(data) {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}`;
  }

  getJavaScriptFunctionPattern() {
    return `// Context7 JavaScript Function Pattern

/** AI ASSISTANT CONTEXT: Utility function with input validation and error handling */
export async function processData(input, options = {}) {
  try {
    // Validate inputs
    if (!input) {
      throw new Error('Input is required');
    }

    const config = {
      format: 'json',
      validateOutput: true,
      ...options
    };

    // Process data
    let result = await performProcessing(input);

    // Format based on options
    if (config.format === 'json') {
      result = JSON.stringify(result);
    }

    // Validate output if requested
    if (config.validateOutput) {
      validateResult(result);
    }

    return result;
  } catch (error) {
    throw new Error(\`Data processing failed: \${error.message}\`);
  }
}

async function performProcessing(data) {
  // Implementation details
  return data;
}

function validateResult(result) {
  // Validation logic
  if (!result) {
    throw new Error('Invalid result');
  }
}`;
  }

  // Generic test patterns
  getVueTestPattern() {
    return '// Vue test pattern would go here';
  }

  getNodeTestPattern() {
    return '// Node.js test pattern would go here';
  }

  getJavaScriptTestPattern() {
    return '// JavaScript test pattern would go here';
  }

  async generateComponentScaffold(componentName, componentType, framework, props) {
    try {
      console.error(`PatternProvider: Generating scaffold for ${componentName} (${componentType})`);

      if (!componentName || !componentType) {
        throw new Error('Component name and type are required');
      }

      const propsArray = Array.isArray(props) ? props : [];
      const frameworkKey = framework ? framework.split('-')[0] : 'javascript';

      let scaffold;
      switch (frameworkKey) {
      case 'react':
        scaffold = this.generateReactScaffold(componentName, componentType, propsArray);
        break;
      case 'vue':
        scaffold = this.generateVueScaffold(componentName, componentType, propsArray);
        break;
      case 'svelte':
        scaffold = this.generateSvelteScaffold(componentName, componentType, propsArray);
        break;
      default:
        scaffold = this.generateJavaScriptScaffold(componentName, componentType, propsArray);
      }

      console.error('PatternProvider: Component scaffold generated successfully');
      return scaffold;
    } catch (error) {
      console.error('PatternProvider: Component scaffold generation failed:', error.message);
      throw new Error(`Component scaffold generation failed: ${error.message}`);
    }
  }

  generateReactScaffold(componentName, componentType, props) {
    return `// Generated ${componentName} scaffold for React
// Component type: ${componentType}
// Props: ${props.join(', ')}

import React from 'react';

interface ${componentName}Props {
  ${props.map(prop => `${prop}: any;`).join('\n  ')}
}

/** AI ASSISTANT CONTEXT: ${componentName} - ${componentType} component */
export const ${componentName}: React.FC<${componentName}Props> = ({
  ${props.join(',\n  ')}
}) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold">${componentName}</h2>
      {/* Component implementation */}
    </div>
  );
};

export default ${componentName};`;
  }

  generateVueScaffold(componentName, componentType, props) {
    return `<!-- Generated ${componentName} scaffold for Vue -->
<!-- Component type: ${componentType} -->
<!-- Props: ${props.join(', ')} -->

<template>
  <div class="p-4">
    <h2 class="text-xl font-semibold">${componentName}</h2>
    <!-- Component implementation -->
  </div>
</template>

<script setup lang="ts">
interface Props {
  ${props.map(prop => `${prop}: any;`).join('\n  ')}
}

defineProps<Props>();

// AI ASSISTANT CONTEXT: ${componentName} - ${componentType} component
</script>`;
  }

  generateSvelteScaffold(componentName, componentType, props) {
    return `<!-- Generated ${componentName} scaffold for Svelte -->
<!-- Component type: ${componentType} -->
<!-- Props: ${props.join(', ')} -->

<script lang="ts">
  // AI ASSISTANT CONTEXT: ${componentName} - ${componentType} component
  ${props.map(prop => `export let ${prop}: any;`).join('\n  ')}
</script>

<div class="p-4">
  <h2 class="text-xl font-semibold">${componentName}</h2>
  <!-- Component implementation -->
</div>`;
  }

  generateJavaScriptScaffold(componentName, componentType, props) {
    return `// Generated ${componentName} scaffold for JavaScript
// Component type: ${componentType}
// Props: ${props.join(', ')}

/** AI ASSISTANT CONTEXT: ${componentName} - ${componentType} component */
export class ${componentName} {
  constructor(${props.map(prop => `${prop}`).join(', ')}) {
    ${props.map(prop => `this.${prop} = ${prop};`).join('\n    ')}
  }
  
  render() {
    return \`<div class="p-4">
      <h2 class="text-xl font-semibold">${componentName}</h2>
      <!-- Component implementation -->
    </div>\`;
  }
}

export default ${componentName};`;
  }
}