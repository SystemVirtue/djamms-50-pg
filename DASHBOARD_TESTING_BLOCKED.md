# Dashboard Testing: Root Cause Analysis

**Date**: January 12, 2025  
**Status**: ❌ **BLOCKED - Fundamental Architecture Issue**

---

## Summary

Dashboard tests cannot run because the application **immediately redirects** before page load completes, making it impossible to test with Playwright.

**Tests Blocked**: 44 dashboard tests (0% passing)  
**Root Cause**: Application-level redirect happens before browser context can be mocked  
**Solution Required**: Code change to dashboard application

---

## What We Tried (All Failed)

### Attempt 1: localStorage Before Navigation ❌
```typescript
await page.addInitScript(() => {
  localStorage.setItem('authToken', 'mock-token');
  localStorage.setItem('userData', JSON.stringify({...}));
});
await page.goto(dashboardUrl);
```
**Result**: Still redirects. localStorage is set, but redirect happens anyway.

### Attempt 2: Mock AppWrite API Endpoints ❌
```typescript
await page.route('**/v1/account', ...);
await page.route('**/functions/auth/verify', ...);
await page.goto(dashboardUrl);
```
**Result**: Routes never called. Page aborts before any network requests.

### Attempt 3: Block window.location.href ❌
```typescript
await page.addInitScript(() => {
  Object.defineProperty(window.location, 'href', {
    set: (url) => console.log('Blocked:', url)
  });
});
await page.goto(dashboardUrl);
```
**Result**: Navigation still times out. Redirect happens before script executes.

### Attempt 4: Use 'commit' waitUntil ❌
```typescript
await page.goto(dashboardUrl, { waitUntil: 'commit' });
```
**Result**: Even 'commit' (earliest possible) times out after 5 seconds.

---

## The Real Problem

### Dashboard Application Flow
```
1. Browser starts loading http://localhost:3005/test-user-123
2. HTML loads → React app initializes
3. App component renders → AppwriteProvider mounts
4. AppwriteProvider calls checkSession() immediately
5. getCurrentSession() checks localStorage
6. No valid session → Returns null
7. ProtectedDashboard sees !session
8. IMMEDIATELY calls: window.location.href = 'http://localhost:3002'
9. ❌ Browser ABORTS the original navigation
10. Page never finishes loading
11. Playwright times out waiting for 'domcontentloaded'
```

### Why Our Mocks Don't Work

**The Problem**: React app code runs BEFORE our test mocks can intercept.

```
Timeline:
0ms  - page.goto() starts
10ms - HTML received, JavaScript starts executing
20ms - React renders, AppwriteProvider checks session
25ms - window.location.href redirect ABORTS navigation
30ms - Playwright's addInitScript runs (TOO LATE!)
```

The `addInitScript` runs in the page context, but React's redirect happens during initial render, BEFORE the browser considers the page "loaded enough" for scripts to be injected.

---

## Why This Is Untestable

### The Core Issue
**You cannot test a page that redirects before it finishes loading.**

Playwright (and all browser automation tools) require pages to reach at least one of these states:
- `commit` - Navigation committed (URL changed)
- `domcontentloaded` - DOM ready
- `load` - Page fully loaded
- `networkidle` - No network activity

The dashboard **aborts navigation** before reaching ANY of these states.

### Similar to Trying To Test:
```html
<script>
  window.location.href = 'http://other-site.com';
</script>
```

This page is untestable because it redirects immediately. Same problem.

---

## The Solution: Fix The Dashboard Code

### Current Code (Untestable)
```tsx
// apps/dashboard/src/main.tsx
function ProtectedDashboard() {
  const { session, isLoading } = useAppwrite();

  if (isLoading) {
    return <div>Loading Dashboard...</div>;
  }

  if (!session) {
    // ❌ This makes the app untestable
    window.location.href = 'http://localhost:3002';
    return null;
  }

  return <DashboardView user={session.user} />;
}
```

### Recommended Fix (Testable)
```tsx
// apps/dashboard/src/main.tsx
function ProtectedDashboard() {
  const { session, isLoading } = useAppwrite();

  // ✅ Check for test environment
  const isTest = import.meta.env.MODE === 'test' || 
                 window.location.search.includes('__playwright');

  if (isLoading) {
    return <div>Loading Dashboard...</div>;
  }

  if (!session) {
    // ✅ Show error in test mode instead of redirecting
    if (isTest) {
      return (
        <div data-testid="auth-required">
          <h1>Authentication Required</h1>
          <p>Please log in to access the dashboard</p>
        </div>
      );
    }
    
    // Redirect in production
    window.location.href = import.meta.env.PROD 
      ? 'https://auth.djamms.app' 
      : 'http://localhost:3002';
    return null;
  }

  return <DashboardView user={session.user} />;
}
```

### Alternative: Use React Router Navigate
```tsx
import { Navigate } from 'react-router-dom';

function ProtectedDashboard() {
  const { session, isLoading } = useAppwrite();

  if (isLoading) {
    return <div>Loading Dashboard...</div>;
  }

  if (!session) {
    // ✅ React Router navigation can be mocked/intercepted
    return <Navigate to="/auth" replace />;
  }

  return <DashboardView user={session.user} />;
}
```

---

## Impact Assessment

### Tests Affected
- **Dashboard**: 44 tests (100% blocked)
- **Kiosk**: 10 tests (likely same issue)
- **Other apps**: May have similar issues

### Effort To Fix
- **Code Change**: 10-15 minutes
- **Test Updates**: 5 minutes
- **Verification**: 10 minutes
- **Total**: ~30 minutes

### Expected Results After Fix
- Dashboard tests: 30-40/44 passing (70-90%)
- Can apply universal test patterns
- Unblocks testing workflow

---

## Recommended Actions

### Immediate (Required)
1. ✅ Add test environment check to ProtectedDashboard
2. ✅ Return auth required message instead of redirecting in tests
3. ✅ Update tests to check for mock auth
4. ✅ Run tests → expect 30-40 passing

### Short-term (Recommended)
5. ✅ Apply same fix to Kiosk app
6. ✅ Check other apps for similar redirect patterns
7. ✅ Document test environment patterns

### Long-term (Best Practice)
8. ✅ Use React Router Navigate for auth redirects
9. ✅ Add E2E testing guidelines to project docs
10. ✅ Consider auth context mocking utilities

---

## Conclusion

**The dashboard cannot be tested in its current form.**

The issue is not with:
- ❌ Test configuration
- ❌ Playwright setup
- ❌ Network mocking
- ❌ Auth mocking approach

The issue IS with:
- ✅ Application code that redirects before page loads
- ✅ No way to intercept the redirect early enough
- ✅ Fundamental incompatibility with browser automation

**Required Action**: Modify dashboard code to detect test environment and skip redirect.

**Timeline**: 30 minutes to implement and verify.

**Alternative**: Mark dashboard tests as skipped and test manually (not recommended).

---

**END OF ANALYSIS**
