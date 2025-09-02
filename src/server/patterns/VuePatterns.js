/**
 * VuePatterns - Vue-specific code patterns
 */

export class VuePatterns {  /**
   * Retrieves data
   * @returns {string} The retrieved data
   */
  /**
   * Retrieves data
   * @returns {string} The retrieved data
   */

  static getComponentPattern() {
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

async function fetchExampleData(title: string): Promise<any[]> {
  const response = await fetch(\`/api/data/\${title}\`);
  if (!response.ok) throw new Error('Failed to fetch data');
  return response.json();
}
</script>`;
  }  /**
   * Retrieves data
   * @returns {string} The retrieved data
   */
  /**
   * Retrieves data
   * @returns {string} The retrieved data
   */


  static getComposablePattern() {
    return `// Context7 Vue Composable Pattern
import { ref, computed, watch } from 'vue';

/** AI ASSISTANT CONTEXT: Vue composable with proper reactivity and error handling */
export function useExample(initialValue: string) {
  const data = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const fetchData = async (value: string) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await fetch(\`/api/data/\${value}\`);
      if (!response.ok) throw new Error('Failed to fetch data');
      
      data.value = await response.json();
    } catch (err) {
      error.value = err;
    } finally {
      loading.value = false;
    }
  };

  // Watch for changes and refetch
  watch(() => initialValue, (newValue) => {
    if (newValue) fetchData(newValue);
  }, { immediate: true });

  return {
    data: computed(() => data.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    refetch: fetchData,
  };
}`;
  }  /**
   * Retrieves data
   * @returns {string} The retrieved data
   */
  /**
   * Retrieves data
   * @returns {string} The retrieved data
   */


  static getTestPattern() {
    return `// Context7 Vue Test Pattern
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import ExampleComponent from './ExampleComponent.vue';

/** AI ASSISTANT CONTEXT: Vue component testing with Vue Query */
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

  const createWrapper = (props = {}) => {
    return mount(ExampleComponent, {
      props: {
        title: 'Test Component',
        ...props,
      },
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]],
      },
    });
  };

  it('should render component with title', () => {
    const wrapper = createWrapper({ title: 'Test Title' });
    expect(wrapper.text()).toContain('Test Title');
  });

  it('should show loading state initially', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('[data-testid="loading"]').exists()).toBe(true);
  });

  it('should handle API errors gracefully', async () => {
    // Mock fetch to simulate error
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));
    
    const wrapper = createWrapper();
    await wrapper.vm.$nextTick();
    
    expect(wrapper.text()).toContain('Error:');
  });
});`;
  }
}