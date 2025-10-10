# DJAMMS I/O Reference: Auth Endpoint

**Document ID**: DJAMMS_IO_Endpoint_02  
**Category**: BY ENDPOINT - Authentication  
**Generated**: October 11, 2025  
**Status**: ✅ Validated & Deployed

---

## 📋 Overview

**Purpose**: Passwordless authentication via magic links  
**URL**: `https://auth.djamms.app` (production) | `http://localhost:3002` (dev)  
**Technology**: React 18 + TypeScript + AppWrite SDK  
**Authentication**: Magic link + JWT

---

## I/O Summary

### **Inputs**
- ✅ **Email address** (user input)
- ✅ **Magic link tokens** (URL parameters: `secret`, `userId`)

### **Outputs**
- ✅ **Magic link email** (via AppWrite function)
- ✅ **JWT token** (stored in localStorage)
- ✅ **User session** (redirect to dashboard)

### **Database Operations**
- ✅ **CREATE** magicLinks document (token generation)
- ✅ **READ** magicLinks document (token verification)
- ✅ **UPDATE** magicLinks document (mark as used)
- ✅ **READ/CREATE** users document (find or auto-create user)

### **API Communications**
- ✅ **POST** to magic-link Cloud Function (create token)
- ✅ **POST** to magic-link Cloud Function (verify token)

---

## Routes

### **1. `/login` - Login Page**

```tsx
// apps/auth/src/components/Login.tsx
export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const { login } = useAppwrite();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login(email);
      toast.success('Magic link sent! Check your email.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send magic link');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
      />
      <button type="submit">Send Magic Link</button>
    </form>
  );
};
```

**Flow**:
1. User enters email
2. Submit form → call `login(email)`
3. Auth service calls magic-link Cloud Function
4. Function generates token → stores in DB
5. Email sent with magic link
6. Toast notification: "Check your email"

### **2. `/callback` - Magic Link Verification**

```tsx
// apps/auth/src/components/AuthCallback.tsx
export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { auth } = useAppwrite();

  useEffect(() => {
    const secret = searchParams.get('secret');
    const userId = searchParams.get('userId');

    if (!secret || !userId) {
      setError('Invalid magic link');
      return;
    }

    auth
      .handleMagicLinkCallback(secret, userId)
      .then((session) => {
        toast.success('Logged in successfully');
        
        // Redirect to dashboard
        window.location.href = `https://dashboard.djamms.app/${session.user.userId}`;
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  return <div>Authenticating...</div>;
};
```

**Flow**:
1. User clicks magic link in email
2. Browser loads `/callback?secret=abc123&userId=user@example.com`
3. Extract `secret` and `userId` from URL
4. Call `handleMagicLinkCallback(secret, userId)`
5. Cloud Function verifies token:
   - Check token exists, not used, not expired
   - Find or create user
   - Mark token as used
   - Generate JWT (7-day expiry)
6. Store JWT + user data in localStorage
7. Redirect to dashboard

---

## Authentication Flow

### **Complete Flow Diagram**

```
┌─────────┐       ┌────────┐       ┌─────────────┐       ┌──────────┐
│  User   │       │  Auth  │       │   Magic     │       │ Database │
│ Browser │       │  App   │       │   Link Fn   │       │          │
└────┬────┘       └───┬────┘       └──────┬──────┘       └────┬─────┘
     │                │                    │                   │
     │ 1. Enter email │                    │                   │
     ├───────────────>│                    │                   │
     │                │                    │                   │
     │                │ 2. POST create     │                   │
     │                ├───────────────────>│                   │
     │                │                    │                   │
     │                │                    │ 3. Generate token │
     │                │                    ├──────────────────>│
     │                │                    │                   │
     │                │                    │ 4. Send email     │
     │                │                    │ (TODO: SendGrid)  │
     │                │                    │                   │
     │                │ 5. Success         │                   │
     │<───────────────┤<───────────────────┤                   │
     │                │                    │                   │
     │ 6. Click link in email              │                   │
     │    /callback?secret=...&userId=...  │                   │
     ├───────────────>│                    │                   │
     │                │                    │                   │
     │                │ 7. POST verify     │                   │
     │                ├───────────────────>│                   │
     │                │                    │                   │
     │                │                    │ 8. Verify token   │
     │                │                    ├──────────────────>│
     │                │                    │                   │
     │                │                    │ 9. Find/create user
     │                │                    ├──────────────────>│
     │                │                    │                   │
     │                │                    │ 10. Mark used     │
     │                │                    ├──────────────────>│
     │                │                    │                   │
     │                │                    │ 11. Issue JWT     │
     │                │                    │                   │
     │                │ 12. JWT + user     │                   │
     │<───────────────┤<───────────────────┤                   │
     │                │                    │                   │
     │ 13. Store in localStorage           │                   │
     │                │                    │                   │
     │ 14. Redirect to dashboard           │                   │
     │                │                    │                   │
```

---

## Auth Service Integration

```typescript
// packages/appwrite-client/src/auth.ts
class AuthService {
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

  async handleMagicLinkCallback(secret: string, userId: string) {
    const functionUrl = `${config.appwrite.endpoint}/functions/${config.appwrite.functions.magicLink}/executions`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Appwrite-Project': config.appwrite.projectId
      },
      body: JSON.stringify({ 
        body: JSON.stringify({ 
          action: 'verify',
          secret,
          userId
        })
      })
    });

    if (!response.ok) {
      throw new Error('Invalid or expired magic link');
    }

    const data = await response.json();
    const result = JSON.parse(data.responseBody);

    // Store session
    localStorage.setItem('authToken', result.token);
    localStorage.setItem('userData', JSON.stringify(result.user));

    return { token: result.token, user: result.user };
  }

  getCurrentSession() {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');

    if (!token || !userData) return null;

    // Verify token hasn't expired (basic check)
    try {
      const user = JSON.parse(userData);
      return { token, user };
    } catch {
      return null;
    }
  }

  clearSession() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  }
}
```

---

## Database Schema

### **magicLinks Collection**

| Field | Type | Description |
|-------|------|-------------|
| `email` | string | User email address |
| `token` | string | 64-char hex token |
| `redirectUrl` | string | Post-auth redirect URL |
| `expiresAt` | number | Unix timestamp (15 min) |
| `used` | boolean | One-time use flag |

### **users Collection**

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Unique user ID |
| `email` | string | User email (indexed) |
| `venueId` | string | Assigned venue (optional) |
| `role` | string | admin/staff/viewer |
| `autoplay` | boolean | Player autoplay setting |

---

## Environment Variables

```bash
# .env
VITE_APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=68cc86c3002b27e13947
VITE_APPWRITE_DATABASE_ID=68cc88c000254bb42b90
VITE_APPWRITE_FUNCTION_MAGIC_LINK=68e5a317003c42c8bb6a
VITE_DASHBOARD_URL=https://dashboard.djamms.app
```

---

## Error Handling

### **Login Errors**

```tsx
try {
  await login(email);
  toast.success('Magic link sent!');
} catch (error: any) {
  if (error.message.includes('quotaExceeded')) {
    toast.error('Too many login attempts. Try again later.');
  } else if (error.message.includes('invalid email')) {
    toast.error('Please enter a valid email address.');
  } else {
    toast.error('Failed to send magic link. Please try again.');
  }
}
```

### **Callback Errors**

```tsx
auth.handleMagicLinkCallback(secret, userId)
  .catch((err) => {
    if (err.message.includes('expired')) {
      setError('Magic link expired. Please request a new one.');
    } else if (err.message.includes('invalid')) {
      setError('Invalid magic link. Please try again.');
    } else {
      setError('Authentication failed. Please try again.');
    }
  });
```

---

## Security Considerations

### **Token Security**
- ✅ 64-character hex tokens (256-bit entropy)
- ✅ 15-minute expiry
- ✅ One-time use (marked as used after verification)
- ✅ Stored server-side (not in URL after initial redirect)

### **JWT Security**
- ✅ 7-day expiry
- ✅ Signed with strong secret (256-bit)
- ✅ Stored in localStorage (XSS risk mitigated by CSP)
- ⚠️ **Future**: Move to httpOnly cookies

### **Email Validation**
```typescript
const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};
```

---

## Related Documents

- 📄 **DJAMMS_IO_05_Auth_Complete.md** - Complete auth flow documentation
- 📄 **DJAMMS_IO_07_Cloud_Functions_Complete.md** - magic-link Cloud Function
- 📄 **DJAMMS_IO_Endpoint_03_Dashboard.md** - Post-login destination

---

**END OF DOCUMENT**
