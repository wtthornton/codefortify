/**
 * PerformanceOptimizer Tests
 *
 * Tests for performance optimization utilities including:
 * - ObjectPool
 * - AdvancedCache
 * - LazyLoader
 * - PerformanceMonitor
 * - BundleOptimizer
 * - Utility functions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ObjectPool,
  AdvancedCache,
  LazyLoader,
  PerformanceMonitor,
  BundleOptimizer,
  debounce,
  throttle,
  memoize,
  BatchProcessor
} from '../../../src/utils/PerformanceOptimizer.js';

describe('ObjectPool', () => {
  let pool;

  beforeEach(() => {
    pool = new ObjectPool(
      () => ({ id: Math.random(), data: null }),
      (obj) => { obj.data = null; },
      5
    );
  });

  it('should initialize with correct number of objects', () => {
    expect(pool.pool.length).toBe(5);
  });

  it('should acquire and release objects correctly', () => {
    const obj = pool.acquire();
    expect(obj).toBeDefined();
    expect(obj.id).toBeDefined();

    pool.release(obj);
    expect(pool.pool.length).toBe(5);
  });

  it('should create new objects when pool is empty', () => {
    // Acquire all objects
    const objects = [];
    for (let i = 0; i < 5; i++) {
      objects.push(pool.acquire());
    }

    expect(pool.pool.length).toBe(0);

    // Acquire one more - should create new object
    const newObj = pool.acquire();
    expect(newObj).toBeDefined();
    expect(pool.pool.length).toBe(0);
  });

  it('should reset objects when releasing', () => {
    const obj = pool.acquire();
    obj.data = 'test';

    pool.release(obj);
    expect(obj.data).toBeNull();
  });
});

describe('AdvancedCache', () => {
  let cache;

  beforeEach(() => {
    cache = new AdvancedCache(3, 100); // 3 items max, 100ms TTL
  });

  afterEach(() => {
    cache.clear();
  });

  it('should set and get values correctly', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('should return undefined for non-existent keys', () => {
    expect(cache.get('nonexistent')).toBeUndefined();
  });

  it('should expire values after TTL', async () => {
    cache.set('key1', 'value1', 50);
    expect(cache.get('key1')).toBe('value1');

    await new Promise(resolve => setTimeout(resolve, 60));
    expect(cache.get('key1')).toBeUndefined();
  });

  it('should evict LRU items when at capacity', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');

    // Access key1 to make it recently used
    cache.get('key1');

    // Add key4 - should evict key2 (least recently used)
    cache.set('key4', 'value4');

    expect(cache.get('key1')).toBe('value1');
    expect(cache.get('key2')).toBeUndefined();
    expect(cache.get('key3')).toBe('value3');
    expect(cache.get('key4')).toBe('value4');
  });

  it('should delete values correctly', () => {
    cache.set('key1', 'value1');
    cache.delete('key1');
    expect(cache.get('key1')).toBeUndefined();
  });

  it('should clear all values', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.clear();

    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key2')).toBeUndefined();
  });
});

describe('LazyLoader', () => {
  let loader;

  beforeEach(() => {
    loader = new LazyLoader();
  });

  it('should load modules correctly', async () => {
    const mockModule = { default: 'test' };
    const importFn = vi.fn().mockResolvedValue(mockModule);

    const result = await loader.loadModule('test-module', importFn);

    expect(result).toBe(mockModule);
    expect(importFn).toHaveBeenCalledTimes(1);
  });

  it('should cache loaded modules', async () => {
    const mockModule = { default: 'test' };
    const importFn = vi.fn().mockResolvedValue(mockModule);

    await loader.loadModule('test-module', importFn);
    await loader.loadModule('test-module', importFn);

    expect(importFn).toHaveBeenCalledTimes(1);
  });

  it('should handle concurrent loading of same module', async () => {
    const mockModule = { default: 'test' };
    const importFn = vi.fn().mockResolvedValue(mockModule);

    const promises = [
      loader.loadModule('test-module', importFn),
      loader.loadModule('test-module', importFn),
      loader.loadModule('test-module', importFn)
    ];

    const results = await Promise.all(promises);

    expect(results).toEqual([mockModule, mockModule, mockModule]);
    expect(importFn).toHaveBeenCalledTimes(1);
  });

  it('should preload modules', async () => {
    const mockModule1 = { default: 'test1' };
    const mockModule2 = { default: 'test2' };
    const importFn1 = vi.fn().mockResolvedValue(mockModule1);
    const importFn2 = vi.fn().mockResolvedValue(mockModule2);

    await loader.preloadModules([
      { path: 'module1', importFn: importFn1 },
      { path: 'module2', importFn: importFn2 }
    ]);

    expect(importFn1).toHaveBeenCalled();
    expect(importFn2).toHaveBeenCalled();
  });
});

describe('PerformanceMonitor', () => {
  let monitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  afterEach(() => {
    monitor.disconnect();
  });

  it('should record timing metrics', () => {
    const stopTiming = monitor.startTiming('test-metric');
    const duration = stopTiming();

    expect(duration).toBeGreaterThan(0);

    const stats = monitor.getStats('test-metric');
    expect(stats.count).toBe(1);
    expect(stats.min).toBe(duration);
    expect(stats.max).toBe(duration);
    expect(stats.avg).toBe(duration);
  });

  it('should record custom metrics', () => {
    monitor.recordMetric('custom-metric', 100);
    monitor.recordMetric('custom-metric', 200);
    monitor.recordMetric('custom-metric', 300);

    const stats = monitor.getStats('custom-metric');
    expect(stats.count).toBe(3);
    expect(stats.min).toBe(100);
    expect(stats.max).toBe(300);
    expect(stats.avg).toBe(200);
    expect(stats.median).toBe(200);
  });

  it('should return null for non-existent metrics', () => {
    const stats = monitor.getStats('nonexistent');
    expect(stats).toBeNull();
  });
});

describe('BundleOptimizer', () => {
  let optimizer;

  beforeEach(() => {
    optimizer = new BundleOptimizer();
  });

  it('should register and apply strategies', () => {
    const mockStrategy = vi.fn((bundle) => ({ ...bundle, optimized: true }));
    optimizer.registerStrategy('test-strategy', mockStrategy);

    const bundle = { code: 'test' };
    const result = optimizer.optimize(bundle, ['test-strategy']);

    expect(result.optimized).toBe(true);
    expect(mockStrategy).toHaveBeenCalledWith(bundle);
  });

  it('should minify code', () => {
    const code = `
      // This is a comment
      function test() {
        return "hello world";
      }
    `;

    const minified = optimizer.minify(code);
    expect(minified).not.toContain('// This is a comment');
    expect(minified).toContain('function test()');
  });
});

describe('debounce', () => {
  it('should debounce function calls', async () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 50);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    expect(mockFn).not.toHaveBeenCalled();

    await new Promise(resolve => setTimeout(resolve, 60));
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should support immediate execution', async () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 50, true);

    debouncedFn();
    expect(mockFn).toHaveBeenCalledTimes(1);

    debouncedFn();
    debouncedFn();

    await new Promise(resolve => setTimeout(resolve, 60));
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});

describe('throttle', () => {
  it('should throttle function calls', async () => {
    const mockFn = vi.fn();
    const throttledFn = throttle(mockFn, 50);

    throttledFn();
    throttledFn();
    throttledFn();

    expect(mockFn).toHaveBeenCalledTimes(1);

    await new Promise(resolve => setTimeout(resolve, 60));
    throttledFn();
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});

describe('memoize', () => {
  it('should memoize function results', () => {
    const expensiveFn = vi.fn((x) => x * 2);
    const memoizedFn = memoize(expensiveFn);

    expect(memoizedFn(5)).toBe(10);
    expect(memoizedFn(5)).toBe(10);
    expect(expensiveFn).toHaveBeenCalledTimes(1);

    expect(memoizedFn(3)).toBe(6);
    expect(expensiveFn).toHaveBeenCalledTimes(2);
  });

  it('should use custom key generator', () => {
    const expensiveFn = vi.fn((a, b) => a + b);
    const memoizedFn = memoize(expensiveFn, (a, b) => `${a}-${b}`);

    expect(memoizedFn(1, 2)).toBe(3);
    expect(memoizedFn(1, 2)).toBe(3);
    expect(expensiveFn).toHaveBeenCalledTimes(1);
  });
});

describe('BatchProcessor', () => {
  let processor;

  beforeEach(() => {
    processor = new BatchProcessor(2, 10); // 2 items per batch, 10ms delay
  });

  it('should process items in batches', async () => {
    const processedItems = [];
    processor.processItem = vi.fn().mockImplementation(async (item) => {
      processedItems.push(item);
      return `processed-${item}`;
    });

    const promises = [
      processor.add('item1'),
      processor.add('item2'),
      processor.add('item3')
    ];

    const results = await Promise.all(promises);

    expect(results).toEqual(['processed-item1', 'processed-item2', 'processed-item3']);
    expect(processedItems).toEqual(['item1', 'item2', 'item3']);
  });

  it('should handle processing errors', async () => {
    processor.processItem = vi.fn().mockRejectedValue(new Error('Processing failed'));

    const promise = processor.add('item1');

    await expect(promise).rejects.toThrow('Processing failed');
  });
});
