# Test Fix Quick Reference Card

**For rapid test fixing - keep this open while working**

---

## Universal Fix Patterns

### Pattern 1: Strict Mode Violation
```typescript
// ❌ BEFORE: page.locator('text=...') → Error: 2 elements
// ✅ AFTER:  page.locator('text=...').first()
```

### Pattern 2: Missing Test ID
```typescript
// ❌ BEFORE: page.locator('[data-testid="..."]') → Not found
// ✅ AFTER:  page.getByRole('heading', { name: /.../ })
```

### Pattern 3: Wrong Port
```
Landing:   3000 ✅
Player:    3001 ✅
Auth:      3002 ✅
Admin:     3003 ✅
Kiosk:     3004 ✅
Dashboard: 3005 ✅
```

### Pattern 4: Auth Required
```typescript
test.beforeEach(async ({ page }) => {
  await page.goto(url);
  await page.evaluate(() => {
    localStorage.setItem('djamms_session', JSON.stringify({
      token: 'mock-jwt-token',
      user: { $id: 'test-user-123', email: 'test@djamms.app' }
    }));
  });
  await page.reload();
});
```

---

## Quick Commands

### Start All Servers
```bash
npm run dev:landing &    # 3000
npm run dev:player &     # 3001
npm run dev:auth &       # 3002
npm run dev:admin &      # 3003
npm run dev:kiosk &      # 3004
npm run dev:dashboard &  # 3005
```

### Run Tests (One Suite)
```bash
npx playwright test tests/e2e/SUITE.spec.ts \
  --timeout=15000 \
  --retries=0 \
  --max-failures=10 \
  --reporter=list
```

### Check Running Ports
```bash
lsof -i :3000-3010 | grep LISTEN
```

---

## Common Selector Fixes

| Old (Fails) | New (Works) |
|-------------|-------------|
| `page.locator('text=...')` | `page.locator('text=...').first()` |
| `page.locator('[data-testid="..."]')` | `page.getByRole('...', { name: /.../ })` |
| `page.locator('.class')` | `page.locator('.class').first()` |
| `expect(locator).toBeVisible()` on multiple | Add `.first()` or use specific role |

---

## Failure Rate By Pattern

| Pattern | % of Failures | Fix Time |
|---------|--------------|----------|
| Strict mode | 40% | 30 sec |
| Missing test-id | 30% | 2 min |
| Wrong port | 15% | 10 sec |
| Unrealistic test | 10% | 5 min |
| Auth | 5% | 3 min |

---

## Results (Validated)

**Landing Tests**:
- Before: 13% pass rate (5/38)
- After: 60% pass rate (23/38)
- **Improvement: +360%**

---

**See TEST_FIX_GUIDE.md for detailed examples**
