# E2E Testing Guide - Admin Console & Request History

**Date**: October 16, 2025  
**Test Files Created**: 2  
**Total Test Cases**: 50+  
**Status**: ✅ Tests created, pending server start

## Test Files Created

### 1. admin-console.spec.ts (278 lines)
**Location**: `tests/e2e/admin-console.spec.ts`

**Test Suites**: 8
- Admin Console (general)
- Player Controls Tab
- Queue Management Tab
- System Settings Tab
- Request History Tab
- Analytics Tab
- Responsive Design
- Connection Status

**Test Cases**: 22
```typescript
✓ should load admin view with header
✓ should display all navigation tabs
✓ should navigate between tabs
✓ should display player controls
✓ should show empty queue message
✓ should display volume slider
✓ should display queue components
✓ should show skip and clear buttons
✓ should display settings sections
✓ should show playlist manager
✓ should have create playlist option
✓ should display history panel
✓ should have filter controls
✓ should display empty state or requests
✓ should filter by status
✓ should display analytics dashboard
✓ should have date range selectors
✓ should load analytics on button click
✓ should display metric cards when data available
✓ should work on mobile viewport
✓ should work on tablet viewport
✓ should display connection indicator
```

### 2. request-history.spec.ts (311 lines)
**Location**: `tests/e2e/request-history.spec.ts`

**Test Suites**: 3
- Request History System
- Analytics Dashboard
- Request Lifecycle Integration

**Test Cases**: 28
```typescript
✓ should display request history interface
✓ should show empty state when no requests
✓ should filter requests by status
✓ should filter requests by date range
✓ should display request details
✓ should show status indicators with correct colors
✓ should paginate results if many requests
✓ should display analytics interface
✓ should have date range selector with defaults
✓ should load analytics data
✓ should display key metrics when data exists
✓ should display popular songs section
✓ should display top requester section
✓ should update analytics when date range changes
✓ should calculate completion rate correctly
✓ should display revenue estimation
✓ should handle complete request flow
... and more
```

## Running the Tests

### Prerequisites
1. **AppWrite Server**: Running and accessible
2. **Admin App**: Started on port 3004
3. **Test Data**: Optional (tests handle empty states)

### Start Admin Server
```bash
# Terminal 1: Start admin dev server
cd /Users/mikeclarkin/DJAMMS_50_page_prompt
npm run dev:admin

# Wait for server to start on http://localhost:3004
```

### Run Tests

**All Admin Tests**:
```bash
npx playwright test tests/e2e/admin-console.spec.ts --reporter=list
```

**All Request History Tests**:
```bash
npx playwright test tests/e2e/request-history.spec.ts --reporter=list
```

**Run Both**:
```bash
npx playwright test tests/e2e/admin-console.spec.ts tests/e2e/request-history.spec.ts --reporter=list
```

**With UI**:
```bash
npx playwright test tests/e2e/admin-console.spec.ts --ui
```

**Specific Test**:
```bash
npx playwright test tests/e2e/admin-console.spec.ts -g "should navigate between tabs"
```

**Debug Mode**:
```bash
npx playwright test tests/e2e/admin-console.spec.ts --debug
```

## Test Configuration

### Timeout Settings
```typescript
--timeout=10000  // 10 seconds per test (default)
--timeout=30000  // 30 seconds for slower tests
```

### Reporter Options
```bash
--reporter=list      # Simple list output
--reporter=html      # HTML report
--reporter=json      # JSON output
--reporter=dot       # Minimal dots
```

### Parallel Execution
```bash
--workers=1    # Sequential (default for these tests)
--workers=4    # 4 parallel workers
```

## Test Coverage

### Admin Console Features
- [x] Header and navigation
- [x] Tab switching
- [x] Player controls display
- [x] Queue management UI
- [x] System settings
- [x] Playlist manager
- [x] Request history panel
- [x] Analytics dashboard
- [x] Responsive design
- [x] Connection status

### Request History Features
- [x] History interface
- [x] Status filtering (queued, playing, completed, cancelled)
- [x] Date range filtering
- [x] Request details display
- [x] Status indicators
- [x] Pagination/results count

### Analytics Features
- [x] Dashboard interface
- [x] Date range selector
- [x] Load analytics button
- [x] Key metrics display
- [x] Popular songs list
- [x] Top requester stats
- [x] Revenue estimation
- [x] Completion rate calculation

## Known Issues & Workarounds

### Issue 1: Server Not Running
**Error**: `net::ERR_CONNECTION_REFUSED at http://localhost:3004`

**Solution**:
```bash
# Start admin server first
npm run dev:admin

# Wait for "Local: http://localhost:3004" message
# Then run tests
```

### Issue 2: Empty State Tests
**Behavior**: Tests expect either data or empty states

**Solution**: Tests use `.or()` locators to handle both cases:
```typescript
await expect(
  page.locator('text=No requests found').or(page.locator('text=Showing'))
).toBeVisible();
```

### Issue 3: Real-time Data Updates
**Issue**: Tests may not see real-time updates

**Solution**: Tests include `waitForTimeout()` to allow updates:
```typescript
await page.click('button:has-text("Apply Filters")');
await page.waitForTimeout(1500); // Wait for data load
```

### Issue 4: AppWrite Connection
**Issue**: Tests require valid AppWrite connection

**Solution**: Set environment variables:
```bash
export VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
export VITE_APPWRITE_PROJECT_ID=your-project-id
export VITE_APPWRITE_DATABASE_ID=main-db
```

## Test Data Requirements

### Minimal (Empty State)
- No test data required
- Tests verify empty states work correctly

### With Sample Data
For more comprehensive testing, create:
- 5-10 request records with various statuses
- Different requesters
- Date range spanning 30+ days
- Mix of completed/cancelled requests

### Mock Data Script
```typescript
// scripts/seed-test-data.ts
import { Client, Databases, ID } from 'appwrite';

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT!)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID!);

const databases = new Databases(client);

async function seedTestData() {
  const venueId = 'test-venue-123';
  const databaseId = 'main-db';
  
  // Create sample requests
  for (let i = 0; i < 10; i++) {
    await databases.createDocument(
      databaseId,
      'requests',
      ID.unique(),
      {
        requestId: ID.unique(),
        venueId,
        song: JSON.stringify({
          videoId: `video-${i}`,
          title: `Test Song ${i}`,
          artist: `Test Artist ${i}`,
          duration: 210,
          thumbnail: 'https://via.placeholder.com/120'
        }),
        requesterId: `user-${i % 3}`, // 3 different users
        paymentId: `pay-${i}`,
        status: ['queued', 'playing', 'completed', 'cancelled'][i % 4],
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
      }
    );
  }
  
  console.log('✓ Test data seeded');
}

seedTestData().catch(console.error);
```

## CI/CD Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Build apps
        run: npm run build
      
      - name: Start servers
        run: |
          npm run dev:admin &
          sleep 10
      
      - name: Run E2E tests
        run: npx playwright test tests/e2e/admin-console.spec.ts tests/e2e/request-history.spec.ts
        env:
          VITE_APPWRITE_ENDPOINT: ${{ secrets.APPWRITE_ENDPOINT }}
          VITE_APPWRITE_PROJECT_ID: ${{ secrets.APPWRITE_PROJECT_ID }}
          VITE_APPWRITE_DATABASE_ID: ${{ secrets.APPWRITE_DATABASE_ID }}
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Expected Results

### All Tests Pass (50/50)
```
Running 50 tests using 1 worker

  ✓ [chromium] › admin-console.spec.ts:26:3 › should load admin view
  ✓ [chromium] › admin-console.spec.ts:33:3 › should display all tabs
  ✓ [chromium] › admin-console.spec.ts:42:3 › should navigate between tabs
  ... (47 more tests)

  50 passed (2m 15s)
```

### Partial Pass (Empty Data)
```
Running 50 tests using 1 worker

  ✓ 45 passed
  ⊘ 5 skipped (conditional tests with no data)

  45 passed, 5 skipped (1m 30s)
```

## Debugging Failed Tests

### View Screenshots
```bash
# Screenshots saved in test-results/
open test-results/admin-console-*/test-failed-1.png
```

### View HTML Report
```bash
npx playwright show-report
```

### Run in Headed Mode
```bash
npx playwright test --headed
```

### Slow Motion
```bash
npx playwright test --headed --slow-mo=1000
```

## Performance Benchmarks

### Target Times
- Tab navigation: < 500ms
- Filter application: < 2s
- Analytics loading: < 3s
- Full test suite: < 3 minutes

### Current Results
- **To be measured after first run**

## Next Steps

1. **Start Admin Server**
   ```bash
   npm run dev:admin
   ```

2. **Run Tests**
   ```bash
   npx playwright test tests/e2e/admin-console.spec.ts --reporter=list
   ```

3. **Review Results**
   - Check for failures
   - Review screenshots
   - Verify functionality

4. **Seed Test Data** (Optional)
   - Create seed script
   - Add sample requests
   - Re-run tests

5. **CI/CD Setup**
   - Add GitHub Actions workflow
   - Configure secrets
   - Enable automated testing

## Summary

✅ **Created**: 2 comprehensive E2E test files  
✅ **Coverage**: 50+ test cases across all admin features  
✅ **Ready**: Tests ready to run once servers start  
⏳ **Pending**: Server start and first test run  

**Total Test Code**: ~590 lines  
**Test Cases**: 50+  
**Suites**: 11  

---

*E2E Testing Guide Complete*  
*Ready for execution and CI/CD integration*
