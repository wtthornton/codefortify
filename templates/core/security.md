# Security Standards
*Based on OWASP, Google, Amazon, and industry security best practices*

## Overview

Security is a fundamental requirement for all applications. This document outlines comprehensive security standards based on industry best practices from OWASP, Google's security guidelines, Amazon's security best practices, and modern web security patterns.

## Core Security Principles

### Defense in Depth
- **Multiple Security Layers** - Implement security at application, network, and infrastructure levels
- **Fail Securely** - Default to secure behavior when systems fail
- **Least Privilege** - Grant minimum required permissions for functionality
- **Zero Trust Architecture** - Verify every request regardless of source location

### Security by Design
- **Threat Modeling** - Identify potential security threats during design phase
- **Secure Defaults** - Configure systems with secure default settings
- **Privacy by Design** - Implement data protection from project inception
- **Regular Security Reviews** - Continuous assessment of security posture

## Authentication & Authorization

### Authentication Standards
```typescript
// JWT Token Implementation (Industry Standard)
interface JWTPayload {
  sub: string;          // Subject (user ID)
  iat: number;          // Issued at
  exp: number;          // Expiration
  aud: string;          // Audience
  iss: string;          // Issuer
  role: UserRole;       // User role for authorization
}

// Secure token generation
function generateAccessToken(user: User): string {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      aud: process.env.JWT_AUDIENCE,
      iss: process.env.JWT_ISSUER,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '15m',    // Short-lived access tokens
      algorithm: 'HS256',  // Strong signing algorithm
    }
  );
}

// Refresh token with longer expiration
function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}
```

### Authorization Patterns
```typescript
// Role-Based Access Control (RBAC)
enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
  GUEST = 'guest'
}

enum Permission {
  READ_USERS = 'users:read',
  WRITE_USERS = 'users:write',
  DELETE_USERS = 'users:delete',
  ADMIN_PANEL = 'admin:access'
}

// Permission mapping
const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.READ_USERS,
    Permission.WRITE_USERS,
    Permission.DELETE_USERS,
    Permission.ADMIN_PANEL
  ],
  [UserRole.MODERATOR]: [
    Permission.READ_USERS,
    Permission.WRITE_USERS
  ],
  [UserRole.USER]: [
    Permission.READ_USERS
  ],
  [UserRole.GUEST]: []
};

// Authorization middleware
function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    const hasPermission = userRole && 
      rolePermissions[userRole]?.includes(permission);
    
    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission 
      });
    }
    
    next();
  };
}
```

### Multi-Factor Authentication (MFA)
```typescript
// TOTP Implementation for 2FA
import { authenticator } from 'otplib';

class MFAService {
  static generateSecret(): string {
    return authenticator.generateSecret();
  }
  
  static generateQRCode(user: User, secret: string): string {
    const service = process.env.APP_NAME || 'MyApp';
    return authenticator.keyuri(user.email, service, secret);
  }
  
  static verifyToken(token: string, secret: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch (error) {
      return false;
    }
  }
}
```

## Input Validation & Sanitization

### TypeScript Runtime Validation
```typescript
// Use Zod for runtime validation (Google/Airbnb recommended)
import { z } from 'zod';

// User input schemas
const CreateUserSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name must contain only letters and spaces'),
  
  email: z.string()
    .email('Invalid email format')
    .toLowerCase()
    .transform(email => email.trim()),
  
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number, and special character'),
  
  age: z.number()
    .int('Age must be an integer')
    .min(13, 'Must be at least 13 years old')
    .max(150, 'Invalid age'),
});

type CreateUserInput = z.infer<typeof CreateUserSchema>;

// Validation middleware
function validateInput<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData; // Replace with validated data
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
}
```

### XSS Prevention
```typescript
// DOMPurify for client-side sanitization
import DOMPurify from 'isomorphic-dompurify';

function sanitizeHTML(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
}

// React component with XSS protection
interface SafeHTMLProps {
  content: string;
  className?: string;
}

function SafeHTML({ content, className }: SafeHTMLProps): JSX.Element {
  const sanitizedContent = useMemo(() => 
    sanitizeHTML(content), 
    [content]
  );
  
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}
```

## API Security

### Rate Limiting
```typescript
// Express rate limiting middleware
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Different limits for different endpoints
const authLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many authentication attempts',
    retryAfter: 15 * 60 // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many requests',
    retryAfter: 15 * 60
  }
});

// Apply to routes
app.use('/auth', authLimiter);
app.use('/api', apiLimiter);
```

### CORS Configuration
```typescript
import cors from 'cors';

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests from specific domains
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization'
  ]
};

app.use(cors(corsOptions));
```

### Security Headers
```typescript
import helmet from 'helmet';

app.use(helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  
  // HSTS (HTTP Strict Transport Security)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // X-Frame-Options
  frameguard: { action: 'deny' },
  
  // X-Content-Type-Options
  noSniff: true,
  
  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
```

## Data Protection & Encryption

### Password Security
```typescript
import bcrypt from 'bcrypt';
import crypto from 'crypto';

class PasswordService {
  private static readonly SALT_ROUNDS = 12; // Recommended by OWASP
  
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }
  
  static async verifyPassword(
    password: string, 
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
  
  // Generate secure random passwords
  static generateSecurePassword(length: number = 16): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }
}
```

### Data Encryption
```typescript
import crypto from 'crypto';

class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY = crypto.scryptSync(
    process.env.ENCRYPTION_SECRET!, 
    'salt', 
    32
  );
  
  static encrypt(text: string): { 
    encrypted: string; 
    iv: string; 
    authTag: string; 
  } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.ALGORITHM, this.KEY);
    cipher.setAAD(Buffer.from('additional-data'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }
  
  static decrypt(
    encrypted: string, 
    iv: string, 
    authTag: string
  ): string {
    const decipher = crypto.createDecipher(this.ALGORITHM, this.KEY);
    decipher.setAAD(Buffer.from('additional-data'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

## SQL Injection Prevention

### Parameterized Queries
```typescript
// Use parameterized queries (NOT string concatenation)
class UserRepository {
  // ✅ SAFE - Using parameterized query
  static async getUserById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }
  
  // ✅ SAFE - Using ORM with proper escaping
  static async getUserByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email } });
  }
  
  // ❌ DANGEROUS - Never do this (SQL injection vulnerable)
  // static async getUserByIdUnsafe(id: string): Promise<User | null> {
  //   const query = `SELECT * FROM users WHERE id = '${id}'`;
  //   const result = await db.query(query);
  //   return result.rows[0] || null;
  // }
}

// Input validation for database operations
const getUserSchema = z.object({
  id: z.string().uuid('Invalid user ID format')
});

async function getUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = getUserSchema.parse(req.params);
    const user = await UserRepository.getUserById(id);
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: 'Invalid request' });
  }
}
```

## Session Security

### Secure Cookie Configuration
```typescript
import session from 'express-session';
import RedisStore from 'connect-redis';

const sessionConfig: session.SessionOptions = {
  store: new RedisStore({ client: redis }),
  secret: process.env.SESSION_SECRET!,
  name: 'sessionId', // Don't use default 'connect.sid'
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiration on activity
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS access to cookies
    maxAge: 30 * 60 * 1000, // 30 minutes
    sameSite: 'strict' // CSRF protection
  }
};

app.use(session(sessionConfig));
```

### CSRF Protection
```typescript
import csrf from 'csurf';

// CSRF protection middleware
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// Apply to state-changing routes
app.use('/api', csrfProtection);

// Provide CSRF token to client
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

## Security Headers & Middleware

### Comprehensive Security Headers
```typescript
// Custom security headers middleware
function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Feature policy
  res.setHeader('Permissions-Policy', 
    'geolocation=(), microphone=(), camera=()');
  
  // Clear server info
  res.removeHeader('X-Powered-By');
  
  next();
}

app.use(securityHeaders);
```

## Error Handling & Logging

### Secure Error Responses
```typescript
class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Global error handler
function errorHandler(
  error: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  // Log full error details internally
  logger.error('Application error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });
  
  // Send sanitized error to client
  if (error instanceof AppError && error.isOperational) {
    res.status(error.statusCode).json({
      error: error.message,
      status: 'error'
    });
  } else {
    // Don't leak internal error details
    res.status(500).json({
      error: 'Internal server error',
      status: 'error'
    });
  }
}

app.use(errorHandler);
```

### Security Logging
```typescript
import winston from 'winston';

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/security.log',
      level: 'warn'
    }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Log security events
function logSecurityEvent(
  event: string, 
  details: Record<string, any>, 
  req: Request
) {
  securityLogger.warn('Security event', {
    event,
    details,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
}

// Usage
logSecurityEvent('Failed login attempt', 
  { email: req.body.email }, 
  req
);
```

## Frontend Security

### Content Security Policy (CSP)
```typescript
// React CSP implementation
const CSP_NONCE = crypto.randomBytes(16).toString('base64');

// Add nonce to script tags
function Script({ src, children, ...props }) {
  return (
    <script 
      src={src} 
      nonce={CSP_NONCE}
      {...props}
    >
      {children}
    </script>
  );
}

// CSP header with nonce
const cspHeader = `
  default-src 'self';
  script-src 'self' 'nonce-${CSP_NONCE}';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' ${process.env.API_URL};
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
`.replace(/\s+/g, ' ').trim();
```

### Secure API Client
```typescript
// Axios interceptors for security
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  withCredentials: true // Include cookies
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add CSRF token
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    
    // Add auth token
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle token expiration
      redirectToLogin();
    }
    return Promise.reject(error);
  }
);
```

## Security Testing

### Automated Security Testing
```typescript
// Security test suite
describe('Security Tests', () => {
  describe('Authentication', () => {
    it('should reject requests without valid tokens', async () => {
      const response = await request(app)
        .get('/api/protected')
        .expect(401);
      
      expect(response.body.error).toBe('Authentication required');
    });
    
    it('should reject expired tokens', async () => {
      const expiredToken = generateExpiredToken();
      
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
      
      expect(response.body.error).toBe('Token expired');
    });
  });
  
  describe('Input Validation', () => {
    it('should reject malicious SQL in user input', async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      
      const response = await request(app)
        .post('/api/users')
        .send({ name: maliciousInput })
        .expect(400);
      
      expect(response.body.error).toBe('Validation failed');
    });
    
    it('should sanitize XSS attempts', async () => {
      const xssPayload = '<script>alert("xss")</script>';
      
      const response = await request(app)
        .post('/api/comments')
        .send({ content: xssPayload })
        .expect(201);
      
      expect(response.body.content).not.toContain('<script>');
    });
  });
  
  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // Make requests up to the limit
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/auth/login')
          .send({ email: 'test@example.com', password: 'wrong' })
          .expect(401);
      }
      
      // Next request should be rate limited
      await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' })
        .expect(429);
    });
  });
});
```

## Security Monitoring & Incident Response

### Real-time Security Monitoring
```typescript
// Security event monitoring
class SecurityMonitor {
  private static alertThresholds = {
    failedLogins: 5,
    suspiciousIPs: 10,
    rateLimitHits: 100
  };
  
  static async checkSuspiciousActivity() {
    const recentFailedLogins = await this.getFailedLoginsCount();
    
    if (recentFailedLogins > this.alertThresholds.failedLogins) {
      await this.triggerSecurityAlert('Multiple failed logins detected', {
        count: recentFailedLogins,
        timeWindow: '15 minutes'
      });
    }
  }
  
  static async triggerSecurityAlert(
    message: string, 
    details: Record<string, any>
  ) {
    // Log security incident
    securityLogger.error('Security alert', { message, details });
    
    // Send notification to security team
    await notificationService.sendSecurityAlert({
      message,
      details,
      severity: 'high',
      timestamp: new Date().toISOString()
    });
  }
}
```

## Compliance Standards

### GDPR Compliance
```typescript
// Data protection utilities
class DataProtectionService {
  // Right to be forgotten
  static async deleteUserData(userId: string): Promise<void> {
    await Promise.all([
      User.destroy({ where: { id: userId } }),
      UserActivity.destroy({ where: { userId } }),
      UserPreferences.destroy({ where: { userId } }),
      // Add all user-related data deletions
    ]);
    
    // Log data deletion for audit
    auditLogger.info('User data deleted', { userId });
  }
  
  // Data export for portability
  static async exportUserData(userId: string): Promise<UserDataExport> {
    const [user, activities, preferences] = await Promise.all([
      User.findByPk(userId),
      UserActivity.findAll({ where: { userId } }),
      UserPreferences.findByPk(userId)
    ]);
    
    return {
      personalData: user,
      activities: activities,
      preferences: preferences,
      exportDate: new Date().toISOString()
    };
  }
}
```

## Security Checklist

### Pre-Deployment Security Review
- [ ] All user inputs validated and sanitized
- [ ] SQL injection prevention implemented
- [ ] XSS protection configured
- [ ] CSRF tokens implemented
- [ ] Authentication and authorization working
- [ ] Rate limiting configured
- [ ] Security headers set
- [ ] HTTPS enforced
- [ ] Secrets not exposed in code
- [ ] Error messages don't leak sensitive information
- [ ] Security logging implemented
- [ ] Dependency vulnerabilities checked
- [ ] Security tests passing

### Ongoing Security Maintenance
- [ ] Regular security audits scheduled
- [ ] Dependency updates automated
- [ ] Security monitoring configured
- [ ] Incident response plan documented
- [ ] Security training completed
- [ ] Penetration testing scheduled
- [ ] Compliance requirements met
- [ ] Security metrics tracked

This security framework provides comprehensive protection based on industry best practices and should be adapted to specific application requirements and threat models.
