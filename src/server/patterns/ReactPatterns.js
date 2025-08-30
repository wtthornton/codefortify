/**
 * ReactPatterns - React-specific code patterns
 */

export class ReactPatterns {
  static getComponentPattern() {
    return `// Context7 React Component Pattern
import React from 'react';
import { useQuery } from '@tanstack/react-query';

interface ExampleComponentProps {
  title: string;
  data?: any[];
}

/** AI ASSISTANT CONTEXT: React component with proper error handling and loading states */
export const ExampleComponent: React.FC<ExampleComponentProps> = ({ title, data }) => {
  const { data: queryData, isLoading, error } = useQuery({
    queryKey: ['example', title],
    queryFn: () => fetchExampleData(title),
    enabled: !!title,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="space-y-2">
        {(queryData || data || []).map((item, index) => (
          <div key={item.id || index} className="p-2 border rounded">
            {/* Component content */}
          </div>
        ))}
      </div>
    </div>
  );
};

async function fetchExampleData(title: string): Promise<any[]> {
  // Implementation here
  return [];
}`;
  }

  static getHookPattern() {
    return `// Context7 React Hook Pattern
import { useState, useEffect, useCallback } from 'react';

/** AI ASSISTANT CONTEXT: Custom hook with proper error handling and cleanup */
export const useExample = (initialValue: string) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (value: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetch(\`/api/data/\${value}\`);
      if (!result.ok) throw new Error('Failed to fetch data');
      
      const data = await result.json();
      setData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialValue) {
      fetchData(initialValue);
    }
  }, [initialValue, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
};`;
  }

  static getTestPattern() {
    return `// Context7 React Test Pattern
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ExampleComponent } from './ExampleComponent';

/** AI ASSISTANT CONTEXT: Comprehensive React component testing */
describe('ExampleComponent', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderWithQuery = (component) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('should render loading state initially', () => {
    renderWithQuery(<ExampleComponent title="Test" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should handle errors gracefully', async () => {
    // Mock fetch to throw error
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));
    
    renderWithQuery(<ExampleComponent title="Test" />);
    
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  it('should render data when loaded successfully', async () => {
    // Mock successful fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ id: 1, name: 'Test Item' }]),
      })
    );
    
    renderWithQuery(<ExampleComponent title="Test" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });
  });
});`;
  }
}