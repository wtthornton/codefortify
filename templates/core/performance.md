# Performance Standards
*Based on Google, Amazon, and Core Web Vitals best practices*

## Overview

Performance is crucial for user experience, SEO, and business success. This document outlines comprehensive performance standards based on Google's Core Web Vitals, Amazon's performance best practices, and modern web optimization techniques.

## Core Performance Metrics

### Core Web Vitals (Google Standards)
- **Largest Contentful Paint (LCP)**: ≤ 2.5 seconds
- **First Input Delay (FID)**: ≤ 100 milliseconds  
- **Cumulative Layout Shift (CLS)**: ≤ 0.1
- **First Contentful Paint (FCP)**: ≤ 1.8 seconds
- **Time to Interactive (TTI)**: ≤ 3.8 seconds

### Performance Budgets
- **Initial Bundle Size**: ≤ 200KB gzipped
- **Route Bundle**: ≤ 100KB per route
- **Image Assets**: WebP format, responsive sizes
- **Critical Resources**: ≤ 14KB initial HTML + CSS
- **Total Page Weight**: ≤ 3MB including all assets

## Frontend Performance Optimization

### Bundle Optimization
```typescript
// Vite configuration for optimal bundling
import { defineConfig } from 'vite';
import { splitVendorChunkPlugin } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor splitting for better caching
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['@headlessui/react', '@radix-ui/react-dialog'],
          'utils': ['date-fns', 'lodash-es']
        }
      }
    },
    // Code splitting and tree shaking
    minify: 'esbuild',
    target: 'es2020',
    sourcemap: false, // Disable in production
  },
  plugins: [
    splitVendorChunkPlugin(), // Automatic vendor chunk splitting
  ]
});

// Dynamic imports for route-based code splitting
const HomePage = lazy(() => import('@/pages/HomePage'));
const UserProfile = lazy(() => import('@/pages/UserProfile'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));

// Component-level code splitting
const HeavyChart = lazy(() => import('@/components/HeavyChart'));

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
```

### React Performance Optimization
```typescript
// Memoization strategies (Google/React team recommendations)
interface UserListProps {
  users: User[];
  onUserSelect: (user: User) => void;
  filters: UserFilters;
}

// Component memoization with custom comparison
const UserList = React.memo<UserListProps>(({ users, onUserSelect, filters }) => {
  // Memoize expensive calculations
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      return (
        (!filters.role || user.role === filters.role) &&
        (!filters.department || user.department === filters.department) &&
        (!filters.searchTerm || user.name.toLowerCase().includes(filters.searchTerm.toLowerCase()))
      );
    });
  }, [users, filters]);

  // Memoize callbacks to prevent child re-renders
  const handleUserClick = useCallback((user: User) => {
    onUserSelect(user);
  }, [onUserSelect]);

  return (
    <div className="user-list">
      {filteredUsers.map(user => (
        <UserCard 
          key={user.id} 
          user={user} 
          onClick={handleUserClick}
        />
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.users === nextProps.users &&
    prevProps.onUserSelect === nextProps.onUserSelect &&
    isEqual(prevProps.filters, nextProps.filters)
  );
});

// Virtualization for large lists (Amazon pattern)
import { FixedSizeList as List } from 'react-window';

interface VirtualizedListProps {
  items: any[];
  itemHeight: number;
  height: number;
}

const VirtualizedList: React.FC<VirtualizedListProps> = ({ 
  items, 
  itemHeight, 
  height 
}) => {
  const Row = useCallback(({ index, style }) => (
    <div style={style}>
      <ItemComponent item={items[index]} />
    </div>
  ), [items]);

  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

### Image Optimization
```typescript
// Next.js Image component with performance optimizations
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false
}) => {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority} // For above-the-fold images
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkrHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R/U6c="
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      quality={85} // Balance between quality and file size
      loading={priority ? "eager" : "lazy"}
    />
  );
};

// Progressive image loading with Intersection Observer
const LazyImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative">
      {/* Placeholder */}
      <div className="w-full h-48 bg-gray-200 animate-pulse" />
      
      {/* Actual image */}
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
        />
      )}
    </div>
  );
};
```

### Resource Loading Optimization
```typescript
// Critical resource hints in HTML head
function DocumentHead() {
  return (
    <Head>
      {/* DNS prefetch for external domains */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//api.example.com" />
      
      {/* Preconnect for critical third-party origins */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      
      {/* Preload critical resources */}
      <link 
        rel="preload" 
        href="/fonts/Inter-Regular.woff2" 
        as="font" 
        type="font/woff2" 
        crossOrigin="" 
      />
      
      {/* Prefetch likely next pages */}
      <link rel="prefetch" href="/dashboard" />
      <link rel="prefetch" href="/profile" />
      
      {/* Critical CSS inline */}
      <style>{criticalCSS}</style>
    </Head>
  );
}

// Service Worker for advanced caching
const CACHE_NAME = 'app-v1';
const STATIC_CACHE = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/fonts/Inter-Regular.woff2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_CACHE))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});
```

## Backend Performance Optimization

### Database Performance
```typescript
// Database query optimization
class UserRepository {
  // Use indexes and limit queries
  static async getUsersWithPagination(
    page: number = 1,
    limit: number = 20,
    filters?: UserFilters
  ): Promise<PaginatedResult<User>> {
    const offset = (page - 1) * limit;
    
    // Optimized query with proper indexing
    const whereClause: any = {};
    if (filters?.role) whereClause.role = filters.role;
    if (filters?.department) whereClause.department = filters.department;
    if (filters?.isActive !== undefined) whereClause.isActive = filters.isActive;
    
    const [users, total] = await Promise.all([
      User.findAll({
        where: whereClause,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Department,
            attributes: ['id', 'name'] // Only fetch needed fields
          }
        ]
      }),
      User.count({ where: whereClause })
    ]);
    
    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  // Connection pooling configuration
  static configureDatabase() {
    return new Sequelize(process.env.DATABASE_URL!, {
      pool: {
        max: 20,         // Maximum connections
        min: 5,          // Minimum connections
        acquire: 30000,  // Max time to get connection
        idle: 10000      // Max idle time
      },
      logging: process.env.NODE_ENV === 'development' ? console.log : false
    });
  }
}

// Redis caching for expensive queries
class CacheService {
  private static redis = new Redis(process.env.REDIS_URL);
  
  static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600 // 1 hour default
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Fetch fresh data
    const data = await fetcher();
    
    // Cache the result
    await this.redis.setex(key, ttl, JSON.stringify(data));
    
    return data;
  }
  
  static async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// Usage example
async function getPopularPosts(): Promise<Post[]> {
  return CacheService.getOrSet(
    'posts:popular',
    async () => {
      return Post.findAll({
        where: { isPublished: true },
        order: [['viewCount', 'DESC']],
        limit: 10,
        include: [{ model: User, attributes: ['id', 'name'] }]
      });
    },
    1800 // 30 minutes cache
  );
}
```

### API Performance
```typescript
// Response compression and optimization
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';

app.use(compression({
  level: 6, // Compression level (1-9)
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress responses if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Efficient pagination with cursor-based approach
interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
  direction?: 'forward' | 'backward';
}

class ApiController {
  static async getPaginatedUsers({
    cursor,
    limit = 20,
    direction = 'forward'
  }: CursorPaginationParams) {
    const whereClause: any = {};
    
    if (cursor) {
      whereClause.id = direction === 'forward' 
        ? { [Op.gt]: cursor }
        : { [Op.lt]: cursor };
    }
    
    const users = await User.findAll({
      where: whereClause,
      limit: limit + 1, // Fetch one extra to check if there's more
      order: [['id', direction === 'forward' ? 'ASC' : 'DESC']]
    });
    
    const hasMore = users.length > limit;
    const data = hasMore ? users.slice(0, -1) : users;
    
    return {
      data,
      pagination: {
        hasMore,
        nextCursor: hasMore ? data[data.length - 1].id : null,
        prevCursor: data.length > 0 ? data[0].id : null
      }
    };
  }
}

// Response caching with ETags
function cacheMiddleware(ttl: number = 300) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `cache:${req.originalUrl}`;
    
    res.locals.cacheKey = key;
    res.locals.cacheTTL = ttl;
    
    // Set cache headers
    res.set('Cache-Control', `public, max-age=${ttl}`);
    
    next();
  };
}
```

### Memory Management
```typescript
// Memory-efficient data processing
class DataProcessor {
  // Stream processing for large datasets
  static async processLargeDataset(filename: string): Promise<void> {
    const readStream = fs.createReadStream(filename);
    const writeStream = fs.createWriteStream(`processed-${filename}`);
    
    return new Promise((resolve, reject) => {
      readStream
        .pipe(csv()) // Parse CSV
        .pipe(new Transform({
          objectMode: true,
          transform(chunk, encoding, callback) {
            // Process each row without loading everything into memory
            const processed = this.processRow(chunk);
            callback(null, JSON.stringify(processed) + '\n');
          }
        }))
        .pipe(writeStream)
        .on('finish', resolve)
        .on('error', reject);
    });
  }
  
  // Batch processing to prevent memory spikes
  static async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 100
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(item => processor(item))
      );
      results.push(...batchResults);
      
      // Allow garbage collection between batches
      if (global.gc) {
        global.gc();
      }
    }
    
    return results;
  }
}

// Memory monitoring
function monitorMemoryUsage() {
  const usage = process.memoryUsage();
  
  logger.info('Memory usage', {
    rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(usage.external / 1024 / 1024)} MB`
  });
  
  // Alert if memory usage is too high
  const heapUsedMB = usage.heapUsed / 1024 / 1024;
  if (heapUsedMB > 500) { // 500MB threshold
    logger.warn('High memory usage detected', { heapUsedMB });
  }
}

// Run memory monitoring every 5 minutes
setInterval(monitorMemoryUsage, 5 * 60 * 1000);
```

## CDN and Caching Strategies

### CDN Configuration
```typescript
// CloudFront configuration for optimal caching
const cloudfrontConfig = {
  // Cache static assets for a long time
  staticAssets: {
    pathPattern: '/static/*',
    cachePolicyId: 'CachingOptimized',
    ttl: {
      default: 86400,    // 24 hours
      max: 31536000,     // 1 year
      min: 0
    }
  },
  
  // API responses with shorter cache
  apiResponses: {
    pathPattern: '/api/*',
    cachePolicyId: 'CachingDisabled', // or custom policy
    ttl: {
      default: 300,      // 5 minutes
      max: 3600,         // 1 hour
      min: 0
    }
  },
  
  // HTML pages with custom caching
  htmlPages: {
    pathPattern: '/*',
    cachePolicyId: 'CustomCaching',
    ttl: {
      default: 1800,     // 30 minutes
      max: 86400,        // 24 hours
      min: 0
    }
  }
};

// Cache headers for different content types
function setCacheHeaders(req: Request, res: Response, next: NextFunction) {
  const { url } = req;
  
  if (url.startsWith('/static/')) {
    // Static assets - long cache
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (url.startsWith('/api/')) {
    // API responses - short cache
    res.set('Cache-Control', 'public, max-age=300, s-maxage=300');
  } else if (url.match(/\.(html|htm)$/)) {
    // HTML pages - moderate cache
    res.set('Cache-Control', 'public, max-age=1800, s-maxage=3600');
  } else {
    // Default - no cache
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  
  next();
}
```

### Browser Caching
```typescript
// Service Worker for advanced caching strategies
const CACHE_STRATEGIES = {
  // Cache first (for static assets)
  cacheFirst: (request: Request) => {
    return caches.match(request).then(response => {
      return response || fetch(request).then(fetchResponse => {
        const responseClone = fetchResponse.clone();
        caches.open('static-cache').then(cache => {
          cache.put(request, responseClone);
        });
        return fetchResponse;
      });
    });
  },
  
  // Network first (for dynamic content)
  networkFirst: (request: Request) => {
    return fetch(request).then(response => {
      const responseClone = response.clone();
      caches.open('dynamic-cache').then(cache => {
        cache.put(request, responseClone);
      });
      return response;
    }).catch(() => {
      return caches.match(request);
    });
  },
  
  // Stale while revalidate (for balanced approach)
  staleWhileRevalidate: (request: Request) => {
    const fetchPromise = fetch(request).then(response => {
      const responseClone = response.clone();
      caches.open('swr-cache').then(cache => {
        cache.put(request, responseClone);
      });
      return response;
    });
    
    return caches.match(request).then(cacheResponse => {
      return cacheResponse || fetchPromise;
    });
  }
};
```

## Performance Monitoring

### Core Web Vitals Tracking
```typescript
// Web Vitals measurement
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

class PerformanceMonitor {
  static init() {
    // Track Core Web Vitals
    getCLS(this.sendToAnalytics);
    getFID(this.sendToAnalytics);
    getFCP(this.sendToAnalytics);
    getLCP(this.sendToAnalytics);
    getTTFB(this.sendToAnalytics);
    
    // Custom performance marks
    this.measureRoutePerformance();
    this.measureAPIPerformance();
  }
  
  static sendToAnalytics(metric: any) {
    // Send to your analytics service
    analytics.track('Web Vital', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      url: window.location.href
    });
    
    // Log performance issues
    if (metric.rating === 'poor') {
      logger.warn(`Poor ${metric.name} performance`, {
        value: metric.value,
        threshold: this.getThreshold(metric.name),
        url: window.location.href
      });
    }
  }
  
  static measureRoutePerformance() {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navigationEntry = entry as PerformanceNavigationTiming;
          
          analytics.track('Route Performance', {
            url: window.location.href,
            domContentLoaded: navigationEntry.domContentLoadedEventEnd - navigationEntry.navigationStart,
            loadComplete: navigationEntry.loadEventEnd - navigationEntry.navigationStart,
            firstByte: navigationEntry.responseStart - navigationEntry.navigationStart
          });
        }
      });
    });
    
    observer.observe({ entryTypes: ['navigation'] });
  }
  
  static measureAPIPerformance() {
    const originalFetch = window.fetch;
    
    window.fetch = async function(...args) {
      const start = performance.now();
      const url = args[0] as string;
      
      try {
        const response = await originalFetch.apply(this, args);
        const duration = performance.now() - start;
        
        analytics.track('API Performance', {
          url,
          duration,
          status: response.status,
          success: response.ok
        });
        
        return response;
      } catch (error) {
        const duration = performance.now() - start;
        
        analytics.track('API Error', {
          url,
          duration,
          error: error.message
        });
        
        throw error;
      }
    };
  }
  
  private static getThreshold(metricName: string): number {
    const thresholds = {
      CLS: 0.1,
      FID: 100,
      FCP: 1800,
      LCP: 2500,
      TTFB: 800
    };
    return thresholds[metricName] || 0;
  }
}

// Initialize performance monitoring
PerformanceMonitor.init();
```

### Real User Monitoring (RUM)
```typescript
// Custom performance metrics collection
class RUMCollector {
  private static metrics: Map<string, number[]> = new Map();
  
  static startMeasurement(name: string): string {
    const id = `${name}-${Date.now()}-${Math.random()}`;
    performance.mark(`${id}-start`);
    return id;
  }
  
  static endMeasurement(id: string): number {
    performance.mark(`${id}-end`);
    performance.measure(id, `${id}-start`, `${id}-end`);
    
    const measure = performance.getEntriesByName(id)[0];
    const duration = measure.duration;
    
    // Store metric
    const metricName = id.split('-')[0];
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }
    this.metrics.get(metricName)!.push(duration);
    
    // Clean up
    performance.clearMarks(`${id}-start`);
    performance.clearMarks(`${id}-end`);
    performance.clearMeasures(id);
    
    return duration;
  }
  
  static getMetricStats(name: string) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return null;
    
    values.sort((a, b) => a - b);
    
    return {
      count: values.length,
      min: values[0],
      max: values[values.length - 1],
      median: values[Math.floor(values.length / 2)],
      p95: values[Math.floor(values.length * 0.95)],
      average: values.reduce((sum, val) => sum + val, 0) / values.length
    };
  }
  
  // Usage in React components
  static measureComponentRender<T extends {}>(
    WrappedComponent: React.ComponentType<T>,
    componentName: string
  ) {
    return function MeasuredComponent(props: T) {
      useEffect(() => {
        const measurementId = RUMCollector.startMeasurement(`component-${componentName}`);
        
        return () => {
          const duration = RUMCollector.endMeasurement(measurementId);
          
          if (duration > 16) { // Slower than 60fps
            logger.warn(`Slow component render: ${componentName}`, { duration });
          }
        };
      });
      
      return <WrappedComponent {...props} />;
    };
  }
}

// Usage
const MeasuredUserProfile = RUMCollector.measureComponentRender(UserProfile, 'UserProfile');
```

## Performance Testing

### Load Testing
```typescript
// Artillery.js configuration for load testing
const loadTestConfig = {
  config: {
    target: 'https://api.example.com',
    phases: [
      { duration: 60, arrivalRate: 10 },    // Warm up
      { duration: 120, arrivalRate: 50 },   // Ramp up
      { duration: 300, arrivalRate: 100 },  // Sustained load
      { duration: 60, arrivalRate: 0 }      // Cool down
    ],
    defaults: {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  },
  scenarios: [
    {
      name: 'User authentication flow',
      weight: 30,
      flow: [
        { post: { url: '/auth/login', json: { email: '{{ email }}', password: 'test123' } } },
        { get: { url: '/api/profile' } },
        { post: { url: '/auth/logout' } }
      ]
    },
    {
      name: 'Browse products',
      weight: 50,
      flow: [
        { get: { url: '/api/products' } },
        { get: { url: '/api/products/{{ productId }}' } },
        { get: { url: '/api/products/{{ productId }}/reviews' } }
      ]
    },
    {
      name: 'Create order',
      weight: 20,
      flow: [
        { post: { url: '/auth/login', json: { email: '{{ email }}', password: 'test123' } } },
        { post: { url: '/api/cart/items', json: { productId: '{{ productId }}', quantity: 1 } } },
        { post: { url: '/api/orders', json: { cartId: '{{ cartId }}' } } }
      ]
    }
  ]
};

// Automated performance testing in CI/CD
class PerformanceTestSuite {
  static async runLighthouseTest(url: string): Promise<LighthouseResult> {
    const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
    
    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance'],
      port: chrome.port
    };
    
    const runnerResult = await lighthouse(url, options);
    await chrome.kill();
    
    const { lhr } = runnerResult;
    
    // Assert performance thresholds
    expect(lhr.audits['largest-contentful-paint'].numericValue).toBeLessThan(2500);
    expect(lhr.audits['first-input-delay'].numericValue).toBeLessThan(100);
    expect(lhr.audits['cumulative-layout-shift'].numericValue).toBeLessThan(0.1);
    
    return lhr;
  }
  
  static async runWebPageTest(url: string): Promise<WebPageTestResult> {
    const wpt = new WebPageTest('www.webpagetest.org', 'YOUR_API_KEY');
    
    return new Promise((resolve, reject) => {
      wpt.runTest(url, {
        runs: 3,
        location: 'Dulles:Chrome',
        connectivity: '3G',
        video: true
      }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }
}
```

## Performance Optimization Checklist

### Frontend Optimization
- [ ] Bundle size < 200KB gzipped
- [ ] Code splitting implemented
- [ ] Images optimized (WebP, responsive)
- [ ] Lazy loading for non-critical resources
- [ ] Service Worker for caching
- [ ] Critical CSS inlined
- [ ] Non-critical CSS async loaded
- [ ] JavaScript minified and compressed
- [ ] Fonts optimized (woff2, font-display: swap)
- [ ] Third-party scripts loaded asynchronously

### Backend Optimization  
- [ ] Database queries optimized with indexes
- [ ] Response compression enabled
- [ ] Caching strategy implemented
- [ ] Connection pooling configured
- [ ] Rate limiting in place
- [ ] CDN configured for static assets
- [ ] Monitoring and alerting set up
- [ ] Memory usage optimized
- [ ] API pagination implemented
- [ ] Background job processing

### Core Web Vitals
- [ ] LCP < 2.5s consistently
- [ ] FID < 100ms for all interactions
- [ ] CLS < 0.1 across all pages
- [ ] FCP < 1.8s for fast perceived loading
- [ ] TTI < 3.8s for interactivity

### Monitoring & Testing
- [ ] Real User Monitoring (RUM) implemented
- [ ] Synthetic monitoring set up
- [ ] Performance budgets defined
- [ ] Load testing automated
- [ ] Lighthouse CI integrated
- [ ] Core Web Vitals tracked
- [ ] Performance alerts configured
- [ ] Regular performance audits scheduled

This performance optimization framework ensures applications meet modern web standards and provide excellent user experiences across all devices and network conditions.
