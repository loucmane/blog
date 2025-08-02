# Claude Code Handler System - Workflow Examples

**Version**: 2.0  
**Updated**: 2025-08-02  
**Purpose**: Real-world workflow demonstrations  

## Overview

This document provides complete examples of common development workflows using the Claude Code Handler System. Each example shows the full interaction from user request to completion.

## Feature Development Workflow

### Example: Implementing User Authentication

#### Initial Request
```
User: "implement user authentication for the blog application"
```

#### System Response
```
Searching for appropriate handler for feature implementation...

Grep: "implement.*feature" in .claude/templates/REGISTRY.md
Found: implement-feature handler in WORKFLOWS.md

Reading handler: implement-feature
Key steps: 1) Initialize work tracking, 2) Create TDD workflow, 3) Implement with tests

Let me ultrathink about this... [S:20250802|W:implementing|H:implement-feature|E:6/"Feature implemented with tests"]
```

#### Handler Execution

**Step 1: Initialize Work Tracking**
```
Creating work folder: docs/ai/work-tracking/active/20250802-user-authentication-ACTIVE/

Initializing tracker.md:
# User Authentication Implementation

## Objective
Implement complete user authentication system for blog application

## Progress
- **10:19** - Started authentication implementation
- **10:19** - Initialized work tracking and TDD workflow

## Technical Approach
- JWT-based authentication
- Secure password hashing
- Login/logout endpoints
- Protected routes middleware

Initializing todos.md:
# Authentication Implementation Tasks

## Current Sprint
- [ ] Create User model with password hashing
- [ ] Implement registration endpoint
- [ ] Implement login endpoint
- [ ] Create JWT middleware
- [ ] Add logout functionality
- [ ] Write comprehensive tests
- [ ] Add input validation
- [ ] Implement rate limiting
```

**Step 2: TDD Implementation**
```
Creating failing tests first (TDD approach):

// tests/auth.test.js
describe('Authentication System', () => {
  test('should register new user with valid data', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'securePassword123'
    };
    
    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);
      
    expect(response.body.user.email).toBe(userData.email);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.password).toBeUndefined();
  });
  
  // ... more tests
});

Tests failing as expected - no implementation yet.
```

**Step 3: Implement Core Functionality**
```
Implementing User model:

// models/User.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class User {
  constructor(email, password) {
    this.email = email;
    this.passwordHash = this.hashPassword(password);
    this.createdAt = new Date();
  }
  
  hashPassword(password) {
    return bcrypt.hashSync(password, 12);
  }
  
  validatePassword(password) {
    return bcrypt.compareSync(password, this.passwordHash);
  }
  
  generateToken() {
    return jwt.sign(
      { userId: this.id, email: this.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }
}

Implementing auth endpoints:

// routes/auth.js
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    // Create user
    const user = new User(email, password);
    await user.save();
    
    // Generate token
    const token = user.generateToken();
    
    res.status(201).json({
      user: { id: user.id, email: user.email },
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

Tests now passing! ✓
```

**Step 4: Progress Update**
```
Updating tracker.md:
- **10:45** - Completed user registration with tests
- **10:45** - Implemented password hashing and JWT generation
- **10:45** - All registration tests passing

Next: Implement login endpoint
```

**Step 5: Complete Implementation**
```
Implementing remaining features:
- Login endpoint with validation
- JWT middleware for protected routes
- Logout functionality
- Rate limiting
- Input sanitization

Final test results:
✓ Authentication System
  ✓ should register new user with valid data
  ✓ should reject registration with invalid email
  ✓ should reject weak passwords
  ✓ should login with valid credentials
  ✓ should reject invalid credentials
  ✓ should protect routes with JWT middleware
  ✓ should handle token expiration
  ✓ should rate limit authentication attempts

8 passing tests
```

**Step 6: Documentation and Completion**
```
Creating API documentation:

# Authentication API

## Registration
POST /api/auth/register

Body:
{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response:
{
  "user": { "id": 1, "email": "user@example.com" },
  "token": "jwt-token-here"
}

## Login
POST /api/auth/login
...

Committing changes:
gac "feat: implement JWT user authentication 'auth.js'"

Final tracker update:
- **11:15** - ✓ Authentication implementation complete
- **11:15** - ✓ All tests passing (8/8)
- **11:15** - ✓ API documentation created
- **11:15** - ✓ Changes committed to git

## Summary
✓ Complete JWT authentication system
✓ Secure password hashing with bcrypt
✓ Registration and login endpoints
✓ Protected route middleware
✓ Comprehensive test coverage
✓ Input validation and rate limiting
✓ API documentation

Authentication system ready for production use.
```

---

## Bug Fixing Workflow

### Example: Fixing Login Validation Error

#### Initial Request
```
User: "users are getting 'invalid credentials' error even with correct passwords"
```

#### System Response
```
Searching for appropriate handler for problem resolution...

Found: fix-problem handler in WORKFLOWS.md
Key steps: 1) Gather evidence, 2) Reproduce issue, 3) Analyze root cause

Let me ultrathink about this... [S:20250802|W:debugging|H:fix-problem|E:6/"Problem resolved with tests"]
```

#### Handler Execution

**Step 1: Evidence Gathering**
```
Gathering evidence about the login issue:

Searching for login-related code:
Serena: find login validation logic

Found:
- routes/auth.js:45 - login endpoint
- models/User.js:23 - validatePassword method
- middleware/auth.js:12 - JWT validation

Checking recent changes:
git log --oneline -10

abc123f fix: update password validation logic
def456g feat: add rate limiting to auth

Suspicious: Recent password validation change
```

**Step 2: Reproduce the Issue**
```
Creating reproduction test:

// tests/debug-login.test.js
test('reproduce login validation error', async () => {
  // Create test user
  const testUser = await User.create({
    email: 'test@example.com',
    password: 'correctPassword123'
  });
  
  // Attempt login with correct credentials
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'test@example.com',
      password: 'correctPassword123'
    });
  
  console.log('Response:', response.body);
  // Expected: 200, Actual: 401 - Issue reproduced!
});

Test output:
Response: { error: 'Invalid credentials' }
✓ Issue reproduced - correct password being rejected
```

**Step 3: Root Cause Analysis**
```
Analyzing the validatePassword method:

// models/User.js - Current implementation
validatePassword(password) {
  return bcrypt.compareSync(password, this.passwordHash);
}

Checking recent changes to this method:
git show abc123f

- validatePassword(password) {
-   return bcrypt.compareSync(password, this.password);
- }
+ validatePassword(password) {
+   return bcrypt.compareSync(password, this.passwordHash);
+ }

The fix looks correct, but let's check the actual data:

Debugging with console.log:
console.log('Stored hash:', this.passwordHash);
console.log('Hash length:', this.passwordHash?.length);

Output:
Stored hash: undefined
Hash length: undefined

🔍 ROOT CAUSE FOUND: passwordHash is undefined!

Checking User creation:
// During registration, password is being stored as 'password', not 'passwordHash'
const user = new User({ email, password: hashedPassword });

But constructor expects 'passwordHash' property!
```

**Step 4: Implement Fix**
```
Fixing the User model:

// models/User.js - Fixed version
constructor(userData) {
  this.email = userData.email;
  // Fix: Handle both hashed and unhashed passwords
  if (userData.passwordHash) {
    this.passwordHash = userData.passwordHash;
  } else if (userData.password) {
    this.passwordHash = this.hashPassword(userData.password);
  }
  this.createdAt = userData.createdAt || new Date();
}

Also fixing registration endpoint:

// routes/auth.js - Registration fix
const user = new User({ 
  email, 
  password // Let constructor handle hashing
});

Running reproduction test:
✓ Login with correct credentials now works!
```

**Step 5: Comprehensive Testing**
```
Adding regression tests:

test('login should work after user registration', async () => {
  // Register user
  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'newuser@example.com',
      password: 'testPassword123'
    });
  
  expect(registerResponse.status).toBe(201);
  
  // Login with same credentials
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'newuser@example.com',
      password: 'testPassword123'
    });
  
  expect(loginResponse.status).toBe(200);
  expect(loginResponse.body.token).toBeDefined();
});

✓ All authentication tests passing
```

**Step 6: Documentation and Completion**
```
Documenting the fix:

## Bug Fix: Login Validation Error

### Problem
Users getting "invalid credentials" error with correct passwords

### Root Cause
User constructor inconsistency:
- Registration stored password as 'password' property
- Validation looked for 'passwordHash' property
- Result: passwordHash was undefined, validation always failed

### Fix
- Updated User constructor to handle both hashed/unhashed passwords
- Fixed registration to use consistent property naming
- Added regression tests to prevent recurrence

### Verification
- ✓ Reproduction test now passes
- ✓ All existing auth tests still pass
- ✓ Manual testing confirms fix

Committing fix:
gac "fix: resolve login validation error 'User.js'"

Login validation issue resolved with comprehensive testing.
```

---

## Code Search and Analysis Workflow

### Example: Finding and Explaining Authentication Middleware

#### Initial Request
```
User: "find the authentication middleware and explain how it works"
```

#### System Response
```
Searching for appropriate handler for code search...

Found: search-code handler in TOOLS.md
Key steps: 1) Multi-strategy search, 2) Provide context, 3) Usage examples

Let me ultrathink about this... [S:20250802|W:analyzing|H:search-code|E:4/"Target found with context"]
```

#### Handler Execution

**Step 1: Multi-Strategy Search**
```
Searching for authentication middleware:

Serena: find middleware related to authentication
Found symbols:
- authenticateToken (middleware/auth.js:15)
- requireAuth (middleware/auth.js:35)
- optionalAuth (middleware/auth.js:55)

Grep: search for middleware patterns
Found files:
- middleware/auth.js - Main auth middleware
- routes/*.js - Usage in routes
- app.js - Global middleware setup
```

**Step 2: Analyze Found Code**
```
Reading middleware/auth.js:

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Main authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    
    try {
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(403).json({ error: 'User not found' });
      }
      
      req.user = user; // Attach user to request
      next();
    } catch (error) {
      res.status(500).json({ error: 'Authentication error' });
    }
  });
};

// Optional authentication (for public endpoints that benefit from user context)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    req.user = null;
    return next();
  }
  
  // Use same logic as authenticateToken but don't fail on missing token
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      req.user = null;
    } else {
      try {
        req.user = await User.findById(decoded.userId);
      } catch (error) {
        req.user = null;
      }
    }
    next();
  });
};

module.exports = { authenticateToken, optionalAuth };
```

**Step 3: Find Usage Examples**
```
Searching for middleware usage:

Grep: "authenticateToken" in routes/
Found usage in:
- routes/profile.js - Protected user profile routes
- routes/admin.js - Admin-only endpoints
- routes/posts.js - Post creation/editing

Example usage:

// routes/profile.js
const { authenticateToken } = require('../middleware/auth');

router.get('/profile', authenticateToken, async (req, res) => {
  // req.user is available here
  res.json({ user: req.user });
});

router.put('/profile', authenticateToken, async (req, res) => {
  // Update user profile
  const user = req.user;
  // ...
});

// routes/posts.js - Mixed usage
router.get('/posts', optionalAuth, async (req, res) => {
  // Public endpoint, but user context helpful for personalization
  const posts = await Post.getPublicPosts();
  if (req.user) {
    // Add user-specific data like favorites
    posts.forEach(post => {
      post.isFavorited = req.user.favorites.includes(post.id);
    });
  }
  res.json(posts);
});

router.post('/posts', authenticateToken, async (req, res) => {
  // Protected: only authenticated users can create posts
  const post = new Post({
    ...req.body,
    authorId: req.user.id
  });
  await post.save();
  res.json(post);
});
```

**Step 4: Provide Comprehensive Explanation**
```
# Authentication Middleware Analysis

## Overview
The authentication system uses JWT-based middleware to protect routes and provide user context.

## Middleware Functions

### authenticateToken
**Purpose**: Strict authentication - requires valid JWT token
**Flow**:
1. Extract Bearer token from Authorization header
2. Verify token using JWT_SECRET
3. Load user from database using token's userId
4. Attach user object to req.user
5. Call next() to continue, or return 401/403 on failure

**Usage**: Protected routes that require authentication

### optionalAuth
**Purpose**: Optional authentication - provides user context when available
**Flow**:
1. Same token extraction and verification
2. On failure, sets req.user = null instead of returning error
3. Always calls next() to continue

**Usage**: Public routes that benefit from user context

## Security Features

1. **JWT Verification**: Uses cryptographic verification with secret
2. **User Validation**: Confirms user still exists in database
3. **Error Handling**: Proper HTTP status codes (401, 403, 500)
4. **Token Format**: Expects "Bearer {token}" format

## Integration Patterns

### Protected Routes
```javascript
router.post('/admin/users', authenticateToken, adminOnly, handler);
//                          ↑             ↑
//                     required auth  additional auth
```

### Public with Context
```javascript
router.get('/posts', optionalAuth, (req, res) => {
  // req.user available if logged in, null otherwise
  const showPrivate = req.user && req.user.isAdmin;
  // ...
});
```

### Error Handling
- 401: No token provided
- 403: Invalid token or user not found
- 500: Database or verification errors

## Best Practices Implemented

1. **Separation of Concerns**: Authentication separate from authorization
2. **Consistent Interface**: Both middlewares use req.user
3. **Graceful Degradation**: Optional auth allows public access
4. **Security First**: Fails securely on errors
5. **Database Sync**: Verifies user still exists

Authentication middleware found and analyzed completely.
```

---

## Performance Optimization Workflow

### Example: Optimizing Database Query Performance

#### Initial Request
```
User: "the user search is really slow, can you optimize it?"
```

#### System Response
```
Searching for appropriate handler for performance improvement...

Found: optimize-performance handler in WORKFLOWS.md
Key steps: 1) Profile current performance, 2) Identify bottlenecks, 3) Implement improvements

Let me ultrathink about this... [S:20250802|W:optimizing|H:optimize-performance|E:6/"Performance improved with benchmarks"]
```

#### Handler Execution

**Step 1: Profile Current Performance**
```
Analyzing user search functionality:

Searching for user search code:
Serena: find user search

Found:
- routes/users.js:25 - GET /api/users/search
- models/User.js:45 - User.search() method
- services/UserService.js:15 - search logic

Current implementation:

// routes/users.js
router.get('/search', async (req, res) => {
  const { query } = req.query;
  const users = await User.search(query);
  res.json(users);
});

// models/User.js
static async search(query) {
  const users = await db.query(
    'SELECT * FROM users WHERE name LIKE ? OR email LIKE ?',
    [`%${query}%`, `%${query}%`]
  );
  return users;
}

Benchmarking current performance:
Time to search "john": 2.3s (1000 users)
Time to search "admin": 3.1s (1000 users)
Database query analysis shows full table scan!
```

**Step 2: Identify Bottlenecks**
```
Performance issues identified:

1. **No Database Indexes**: LIKE queries cause full table scans
2. **Inefficient Query**: Searching all columns with OR
3. **No Pagination**: Returns all matching results
4. **No Caching**: Every search hits database
5. **No Input Optimization**: No minimum query length

Database analysis:
EXPLAIN SELECT * FROM users WHERE name LIKE '%john%' OR email LIKE '%john%';

| type | rows | filtered | Extra |
|------|------|----------|-------|
| ALL  | 1000 | 11.11    | Using where |

Full table scan confirmed - no indexes being used.
```

**Step 3: Implement Optimizations**

**Database Optimization:**
```sql
-- Add indexes for search performance
CREATE INDEX idx_users_name ON users(name);
CREATE INDEX idx_users_email ON users(email);
-- Full-text search index for better text matching
CREATE FULLTEXT INDEX idx_users_search ON users(name, email);
```

**Query Optimization:**
```javascript
// models/User.js - Optimized version
static async search(query, options = {}) {
  const { limit = 20, offset = 0, minLength = 3 } = options;
  
  // Validate input
  if (!query || query.length < minLength) {
    return { users: [], total: 0 };
  }
  
  // Use full-text search for better performance
  const searchQuery = `
    SELECT id, name, email, created_at
    FROM users 
    WHERE MATCH(name, email) AGAINST(? IN BOOLEAN MODE)
    LIMIT ? OFFSET ?
  `;
  
  const countQuery = `
    SELECT COUNT(*) as total
    FROM users 
    WHERE MATCH(name, email) AGAINST(? IN BOOLEAN MODE)
  `;
  
  const [users, [{ total }]] = await Promise.all([
    db.query(searchQuery, [query, limit, offset]),
    db.query(countQuery, [query])
  ]);
  
  return { users, total };
}
```

**Caching Layer:**
```javascript
// services/UserService.js - With caching
const Redis = require('redis');
const redis = Redis.createClient();

class UserService {
  static async search(query, options = {}) {
    const cacheKey = `user_search:${query}:${JSON.stringify(options)}`;
    
    // Check cache first
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.log('Cache miss:', error.message);
    }
    
    // Perform search
    const results = await User.search(query, options);
    
    // Cache results for 5 minutes
    try {
      await redis.setex(cacheKey, 300, JSON.stringify(results));
    } catch (error) {
      console.log('Cache write failed:', error.message);
    }
    
    return results;
  }
}
```

**API Optimization:**
```javascript
// routes/users.js - Optimized endpoint
router.get('/search', async (req, res) => {
  try {
    const { 
      query, 
      page = 1, 
      limit = 20 
    } = req.query;
    
    // Input validation
    if (!query || query.length < 3) {
      return res.status(400).json({ 
        error: 'Query must be at least 3 characters' 
      });
    }
    
    const offset = (page - 1) * limit;
    const results = await UserService.search(query, { 
      limit: Math.min(limit, 100), // Max 100 results
      offset 
    });
    
    res.json({
      users: results.users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: results.total,
        pages: Math.ceil(results.total / limit)
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});
```

**Step 4: Benchmark Improvements**
```
Performance testing results:

Before optimization:
- Search "john": 2.3s
- Search "admin": 3.1s
- Database: Full table scan
- Memory: High (loading all users)

After optimization:
- Search "john": 45ms (↓ 98% improvement)
- Search "admin": 52ms (↓ 98% improvement)
- Database: Index scan
- Memory: Low (pagination)
- Cache hit rate: 85% after warmup

Detailed benchmarks:

load test --target http://localhost:3000/api/users/search?query=john

Before:
  Requests: 100
  Average: 2.1s
  95th percentile: 3.8s
  99th percentile: 5.2s

After:
  Requests: 100
  Average: 48ms
  95th percentile: 89ms
  99th percentile: 124ms

🚀 Performance improved by 98%!
```

**Step 5: Documentation and Monitoring**
```
Creating performance documentation:

# User Search Optimization

## Performance Improvements

### Database
- Added full-text search indexes
- Optimized query to use MATCH AGAINST
- Added pagination to limit result sets

### Application
- Implemented Redis caching (5min TTL)
- Added input validation (min 3 chars)
- Limited maximum results per page

### API
- Added pagination parameters
- Improved error handling
- Input sanitization

## Monitoring
- Query performance: < 100ms target
- Cache hit rate: > 80% target
- Memory usage: Reduced by 85%

## Future Optimizations
- Implement search analytics
- Add search suggestions/autocomplete
- Consider Elasticsearch for complex search

Committing optimizations:
gac "perf: optimize user search with indexing and caching 'UserService.js'"

User search performance optimized with 98% improvement.
```

---

## Summary

These examples demonstrate how the Claude Code Handler System transforms development workflows:

1. **Structured Approach**: Every task follows a consistent, documented process
2. **Real-time Documentation**: Progress is tracked automatically
3. **Quality Assurance**: Built-in testing and validation
4. **Context Preservation**: Work can be resumed seamlessly
5. **Best Practices**: TDD, proper git workflow, comprehensive testing

The system ensures that whether you're implementing features, fixing bugs, analyzing code, or optimizing performance, you follow proven workflows that produce high-quality, well-documented results.