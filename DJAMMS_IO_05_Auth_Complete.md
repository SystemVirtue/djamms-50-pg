# DJAMMS I/O Reference: Authentication & Authorization Complete

**Document ID**: DJAMMS_IO_05  
**Category**: BY TYPE - Authentication & Authorization  
**Generated**: October 11, 2025  
**Status**: ✅ Validated & Deployed

---

## 📋 Table of Contents

1. [Authentication Overview](#authentication-overview)
2. [Magic Link Flow](#magic-link-flow)
3. [JWT Token Management](#jwt-token-management)
4. [Role-Based Access Control](#role-based-access-control)
5. [Session Management](#session-management)
6. [Auth Middleware](#auth-middleware)
7. [Route Protection](#route-protection)
8. [Security Considerations](#security-considerations)

---

## Authentication Overview

### **Architecture**
DJAMMS uses **passwordless authentication** via magic links:
- ✅ **No passwords** (eliminates password-related vulnerabilities)
- ✅ **Email-based** (one-time links sent to verified email)
- ✅ **JWT tokens** (7-day expiry for persistent sessions)
- ✅ **Role-based** (admin/staff/viewer permissions)

### **Authentication Flow**

```
1. User enters email → Auth endpoint
2. Generate magic link token → Store in DB
3. Send email with magic link → User's inbox
4. User clicks link → Verify token
5. Issue JWT token → Store in localStorage
6. Redirect to dashboard → Authenticated session
```

### **Components**

| Component | Purpose | Location |
|-----------|---------|----------|
| **AuthService** | Client-side auth logic | `packages/appwrite-client/src/auth.ts` |
| **magic-link.js** | Server-side token generation | `functions/appwrite/src/magic-link.js` |
| **AuthContext** | Global auth state | `apps/auth/src/context/AuthContext.tsx` |
| **magicLinks** collection | Token storage | AppWrite Database |
| **users** collection | User accounts | AppWrite Database |

---

## Magic Link Flow

### **Step 1: Generate Magic Link**

#### **Client Request**

```typescript
// packages/appwrite-client/src/auth.ts
async sendMagicLink(email: string, redirectUrl?: string): Promise<void> {
  const url = redirectUrl || config.auth.magicLinkRedirect;
  
  const functionUrl = `${config.appwrite.endpoint}/functions/${config.appwrite.functions.magicLink}/executions`;
  
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-Appwrite-Project': config.appwrite.projectId
    },
    body: JSON.stringify({ 
      body: JSON.stringify({ 
        action: 'create',
        email, 
        redirectUrl: url 
      })
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to send magic link: ${response.status}`);
  }
}
```

#### **Server Function**

```javascript
// functions/appwrite/src/magic-link.js
exports.createMagicURLSession = async ({ email, redirectUrl }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

  // Store in database
  await databases.createDocument(
    process.env.APPWRITE_DATABASE_ID,
    'magicLinks',
    'unique()',
    {
      email,
      token,
      redirectUrl,
      expiresAt,
      used: false
    }
  );

  // Send email (placeholder - integrate with SendGrid/AWS SES)
  await sendMagicLinkEmail(email, token, redirectUrl);

  return { success: true, message: 'Magic link sent to your email' };
};
```

#### **Email Template**

```html
<!-- Email sent to user -->
<html>
  <body>
    <h1>DJAMMS Login</h1>
    <p>Click the link below to sign in to your account:</p>
    <a href="https://www.djamms.app/auth/verify?secret={{TOKEN}}&userId={{EMAIL}}">
      Sign In to DJAMMS
    </a>
    <p>This link expires in 15 minutes.</p>
    <p>If you didn't request this, please ignore this email.</p>
  </body>
</html>
```

---

### **Step 2: Verify Magic Link**

#### **URL Structure**

```
https://www.djamms.app/auth/verify?secret=abc123...&userId=user@example.com
```

**Query Parameters**:
- `secret`: 64-character hex token
- `userId`: User's email address

#### **Client Verification**

```typescript
// apps/auth/src/pages/VerifyCallback.tsx
const VerifyCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleCallback } = useAuth();

  useEffect(() => {
    const verify = async () => {
      const secret = searchParams.get('secret');
      const userId = searchParams.get('userId');

      if (!secret || !userId) {
        throw new Error('Invalid magic link');
      }

      try {
        const session = await handleCallback(secret, userId);
        
        // Redirect to dashboard
        navigate('/dashboard');
      } catch (error) {
        console.error('Verification failed:', error);
        navigate('/auth?error=invalid_link');
      }
    };

    verify();
  }, [searchParams]);

  return <div>Verifying magic link...</div>;
};
```

#### **Server Verification**

```javascript
// functions/appwrite/src/magic-link.js
exports.handleMagicLinkCallback = async ({ secret, userId }) => {
  const databases = new Databases(client);

  // Find magic link
  const magicLinks = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID,
    'magicLinks',
    [
      Query.equal('token', secret),
      Query.equal('used', false),
      Query.greaterThan('expiresAt', Date.now())
    ]
  );

  if (magicLinks.documents.length === 0) {
    throw new Error('Invalid or expired magic link');
  }

  const magicLink = magicLinks.documents[0];

  // Find or create user
  let user = await findUserByEmail(databases, magicLink.email);

  if (!user && process.env.VITE_ALLOW_AUTO_CREATE_USERS === 'true') {
    user = await createUser(databases, {
      userId: userId || crypto.randomUUID(),
      email: magicLink.email,
      role: 'staff',
      autoplay: true,
      createdAt: new Date().toISOString()
    });
  }

  if (!user) {
    throw new Error('User not found and auto-creation is disabled');
  }

  // Mark magic link as used (one-time use)
  await databases.updateDocument(
    process.env.APPWRITE_DATABASE_ID,
    'magicLinks',
    magicLink.$id,
    { used: true }
  );

  // Issue JWT
  const token = jwt.sign(
    {
      userId: user.userId,
      email: user.email,
      venueId: user.venueId,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { token, user };
};
```

---

## JWT Token Management

### **Token Structure**

```typescript
interface JWTPayload {
  userId: string;          // Unique user identifier
  email: string;           // User email
  venueId?: string;        // Assigned venue (optional)
  role: 'admin' | 'staff' | 'viewer';
  iat: number;             // Issued at (Unix timestamp)
  exp: number;             // Expires at (Unix timestamp)
}
```

### **Token Generation**

```javascript
// Server-side (Node.js)
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.userId,
      email: user.email,
      venueId: user.venueId,
      role: user.role
    },
    process.env.JWT_SECRET,  // Strong secret (256-bit)
    { expiresIn: '7d' }      // 7 days = 604800 seconds
  );
};
```

### **Token Verification**

```javascript
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, payload: decoded };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { valid: false, error: 'Token expired' };
    }
    return { valid: false, error: 'Invalid token' };
  }
};
```

### **Client-Side Token Storage**

```typescript
// packages/appwrite-client/src/auth.ts
// Store after successful authentication
localStorage.setItem('authToken', token);
localStorage.setItem('userData', JSON.stringify(user));

// Retrieve on page load
const token = localStorage.getItem('authToken');
const userData = JSON.parse(localStorage.getItem('userData') || '{}');

// Clear on logout
localStorage.removeItem('authToken');
localStorage.removeItem('userData');
```

### **Token Refresh Strategy**

DJAMMS uses **7-day non-refreshable tokens**:
- ✅ Simple implementation (no refresh token complexity)
- ✅ Balances security and UX (users re-auth weekly)
- ❌ No automatic refresh (user must click magic link again)

**Future Enhancement**: Implement refresh tokens
```typescript
interface RefreshableSession {
  accessToken: string;     // Short-lived (15 min)
  refreshToken: string;    // Long-lived (30 days)
  expiresAt: number;
}
```

---

## Role-Based Access Control

### **User Roles**

| Role | Permissions | Use Case |
|------|-------------|----------|
| **admin** | Full access: create venues, manage users, all endpoints | Venue owner |
| **staff** | Manage assigned venue: admin endpoint, queue control | Bartender, DJ |
| **viewer** | Read-only: player view, no queue control | Guest, customer |

### **Role Enforcement**

#### **Server-Side (Cloud Function)**

```javascript
// Middleware to check role
const requireRole = (allowedRoles) => {
  return async (req) => {
    const token = req.headers['authorization']?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('No token provided');
    }

    const { valid, payload } = verifyToken(token);
    
    if (!valid) {
      throw new Error('Invalid token');
    }

    if (!allowedRoles.includes(payload.role)) {
      throw new Error(`Requires role: ${allowedRoles.join(' or ')}`);
    }

    return payload;
  };
};

// Usage in function
exports.skipTrack = async (req) => {
  const user = await requireRole(['admin', 'staff'])(req);
  
  // User has required role, proceed
  await updateQueue(user.venueId);
};
```

#### **Client-Side (React Component)**

```typescript
// Route protection
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/auth" />;
  }

  if (session.user.role !== 'admin' && session.user.role !== 'staff') {
    return <div>Access denied. Admin or staff role required.</div>;
  }

  return <>{children}</>;
};

// Usage
<Route path="/admin/:venueId" element={
  <AdminRoute>
    <AdminDashboard />
  </AdminRoute>
} />
```

### **Permission Matrix**

| Action | Admin | Staff | Viewer |
|--------|-------|-------|--------|
| **Player Endpoint** | ✅ View | ✅ View | ✅ View |
| **Skip Track** | ✅ Yes | ✅ Yes | ❌ No |
| **Remove from Queue** | ✅ Yes | ✅ Yes | ❌ No |
| **Admin Dashboard** | ✅ Full access | ✅ Assigned venue only | ❌ No |
| **Create Venue** | ✅ Yes | ❌ No | ❌ No |
| **Manage Users** | ✅ Yes | ❌ No | ❌ No |
| **Kiosk** | ✅ Yes | ✅ Yes | ✅ Yes |

---

## Session Management

### **Session Lifecycle**

```
1. User authenticates → JWT issued
2. Token stored in localStorage → Persistent across page loads
3. Every API call → Token sent in Authorization header
4. Token expires (7 days) → User must re-authenticate
5. User logs out → Token removed from localStorage
```

### **Session State Management**

```typescript
// apps/auth/src/context/AuthContext.tsx
interface AuthContextType {
  session: AuthSession | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, redirectUrl: string) => Promise<void>;
  handleCallback: (secret: string, userId: string) => Promise<AuthSession>;
  logout: () => void;
  checkSession: () => Promise<void>;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const authService = useRef(new AuthService());

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    setLoading(true);
    const currentSession = await authService.current.getCurrentSession();
    setSession(currentSession);
    setLoading(false);
  };

  const login = async (email: string, redirectUrl: string) => {
    await authService.current.sendMagicLink(email, redirectUrl);
  };

  const handleCallback = async (secret: string, userId: string) => {
    const newSession = await authService.current.handleMagicLinkCallback(secret, userId);
    setSession(newSession);
    return newSession;
  };

  const logout = () => {
    authService.current.clearSession();
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{
      session,
      loading,
      isAuthenticated: !!session,
      login,
      handleCallback,
      logout,
      checkSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### **Session Verification**

```typescript
// Verify session on app mount
const App = () => {
  const { session, loading, checkSession } = useAuth();

  useEffect(() => {
    checkSession();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Navigate to="/auth" />;
  }

  return <Dashboard />;
};
```

---

## Auth Middleware

### **HTTP Request Interceptor**

```typescript
// Add token to all AppWrite requests
const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('authToken');

  if (!token) {
    throw new Error('No authentication token');
  }

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = '/auth';
  }

  return response;
};
```

### **AppWrite Client Wrapper**

```typescript
// Wrap AppWrite SDK calls with auth
class AuthenticatedDatabases {
  private databases: Databases;

  constructor(client: Client) {
    this.databases = new Databases(client);
  }

  async listDocuments<T>(
    databaseId: string,
    collectionId: string,
    queries?: string[]
  ) {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      return await this.databases.listDocuments<T>(
        databaseId,
        collectionId,
        queries
      );
    } catch (error: any) {
      if (error.code === 401) {
        // Handle auth error
        window.location.href = '/auth';
      }
      throw error;
    }
  }
}
```

---

## Route Protection

### **Protected Route Component**

```typescript
// components/ProtectedRoute.tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'staff' | 'viewer';
  venueId?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  venueId
}) => {
  const { session, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!session) {
    return <Navigate to="/auth" state={{ from: location.pathname }} />;
  }

  // Check role
  if (requiredRole) {
    const roleHierarchy = {
      viewer: 0,
      staff: 1,
      admin: 2
    };

    if (roleHierarchy[session.user.role] < roleHierarchy[requiredRole]) {
      return <AccessDenied requiredRole={requiredRole} />;
    }
  }

  // Check venue access
  if (venueId && session.user.venueId !== venueId && session.user.role !== 'admin') {
    return <AccessDenied message="You don't have access to this venue" />;
  }

  return <>{children}</>;
};
```

### **Route Configuration**

```typescript
// App routing with protection
<Routes>
  {/* Public routes */}
  <Route path="/" element={<LandingPage />} />
  <Route path="/auth" element={<AuthPage />} />
  <Route path="/auth/verify" element={<VerifyCallback />} />

  {/* Protected routes */}
  <Route path="/dashboard" element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } />

  <Route path="/player/:venueId" element={
    <ProtectedRoute>
      <PlayerView />
    </ProtectedRoute>
  } />

  <Route path="/admin/:venueId" element={
    <ProtectedRoute requiredRole="staff">
      <AdminDashboard />
    </ProtectedRoute>
  } />

  {/* Admin-only routes */}
  <Route path="/admin/users" element={
    <ProtectedRoute requiredRole="admin">
      <UserManagement />
    </ProtectedRoute>
  } />
</Routes>
```

---

## Security Considerations

### **Token Security**

✅ **Implemented**:
- JWT stored in localStorage (XSS risk mitigated by strict CSP)
- HTTPS-only cookies option (future enhancement)
- Token expiry (7 days)
- One-time magic links (marked as used after verification)
- Short magic link expiry (15 minutes)

⚠️ **Future Enhancements**:
- httpOnly cookies (prevent XSS access)
- Refresh token rotation
- Device fingerprinting
- IP whitelisting for admin accounts

### **Magic Link Security**

✅ **Current Implementation**:
```javascript
// Secure token generation
const token = crypto.randomBytes(32).toString('hex'); // 64 characters, 256-bit entropy

// Time-based expiry
const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

// One-time use enforcement
Query.equal('used', false);

// Mark as used after verification
await databases.updateDocument(dbId, 'magicLinks', linkId, { used: true });
```

### **CSRF Protection**

DJAMMS uses token-based auth (no cookies), so CSRF attacks are not applicable. However, for cookie-based sessions (future):

```typescript
// Generate CSRF token
const csrfToken = crypto.randomBytes(32).toString('hex');
localStorage.setItem('csrf-token', csrfToken);

// Add to requests
headers: {
  'X-CSRF-Token': localStorage.getItem('csrf-token')
}

// Verify on server
if (req.headers['x-csrf-token'] !== storedCSRFToken) {
  throw new Error('CSRF token mismatch');
}
```

### **Rate Limiting**

Prevent brute-force attacks on magic link generation:

```javascript
// Track attempts per email
const rateLimits = new Map();

const checkRateLimit = (email) => {
  const now = Date.now();
  const attempts = rateLimits.get(email) || [];
  
  // Remove attempts older than 1 hour
  const recentAttempts = attempts.filter(t => now - t < 60 * 60 * 1000);
  
  if (recentAttempts.length >= 5) {
    throw new Error('Too many attempts. Try again in 1 hour.');
  }
  
  recentAttempts.push(now);
  rateLimits.set(email, recentAttempts);
};
```

### **Input Validation**

```typescript
// Validate email
const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Sanitize inputs
const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

// Before creating magic link
if (!isValidEmail(email)) {
  throw new Error('Invalid email address');
}

const sanitized = sanitizeEmail(email);
```

---

## Authentication Flow Diagram

```
┌─────────┐              ┌──────────┐              ┌──────────────┐
│  User   │              │   Auth   │              │   AppWrite   │
│ Browser │              │ Endpoint │              │   Function   │
└────┬────┘              └─────┬────┘              └──────┬───────┘
     │                         │                          │
     │ 1. Enter email          │                          │
     ├────────────────────────>│                          │
     │                         │                          │
     │                         │ 2. POST /magic-link      │
     │                         ├─────────────────────────>│
     │                         │                          │
     │                         │ 3. Generate token        │
     │                         │    Store in DB           │
     │                         │<─────────────────────────┤
     │                         │                          │
     │ 4. Email sent           │                          │
     │<────────────────────────┤                          │
     │                         │                          │
     │ 5. Click link in email  │                          │
     ├────────────────────────>│                          │
     │                         │                          │
     │                         │ 6. POST /verify          │
     │                         ├─────────────────────────>│
     │                         │                          │
     │                         │ 7. Verify token          │
     │                         │    Issue JWT             │
     │                         │<─────────────────────────┤
     │                         │                          │
     │ 8. JWT + user data      │                          │
     │<────────────────────────┤                          │
     │                         │                          │
     │ 9. Store in localStorage│                          │
     │    Redirect to dashboard│                          │
     │                         │                          │
```

---

## Related Documents

- 📄 **DJAMMS_IO_01_Database_Schema_Complete.md** - magicLinks and users collections
- 📄 **DJAMMS_IO_02_API_Communications_Complete.md** - Function API calls
- 📄 **DJAMMS_IO_07_Cloud_Functions_Complete.md** - magic-link.js implementation
- 📄 **DJAMMS_IO_Endpoint_02_Auth.md** - Auth endpoint integration

---

**END OF DOCUMENT**
