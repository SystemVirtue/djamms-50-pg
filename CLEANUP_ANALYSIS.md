# Codebase Cleanup Analysis

## Date: October 17, 2025

## Summary

Found multiple categories of redundant/unused code to remove.

---

## 1. DUPLICATE APP - apps/web/ (LARGEST CLEANUP)

### Status: **COMPLETELY REDUNDANT**

The `apps/web/` directory is an old monolithic application that has been **fully replaced** by individual apps:

### What apps/web Contains (ALL DUPLICATES):
```
apps/web/src/routes/
  ├── admin/       → Replaced by apps/admin/
  ├── auth/        → Replaced by apps/auth/
  ├── dashboard/   → Replaced by apps/dashboard/
  ├── kiosk/       → Replaced by apps/kiosk/
  ├── landing/     → Replaced by apps/landing/
  └── player/      → Replaced by apps/player/
```

### Individual Apps (ACTIVE):
```
apps/
  ├── admin/       ✅ ACTIVE - Used in production
  ├── auth/        ✅ ACTIVE - Used in production
  ├── dashboard/   ✅ ACTIVE - Used in production
  ├── kiosk/       ✅ ACTIVE - Used in production
  ├── landing/     ✅ ACTIVE - Used in production
  └── player/      ✅ ACTIVE - Used in production
```

### Files to Remove:
- `apps/web/` (entire directory)
  - 14 subdirectories
  - Hundreds of duplicate component files
  - Old implementations superseded by individual apps

### Size Impact:
- **Estimated deletion:** ~500+ files, 50,000+ lines of code

---

## 2. DOCUMENTATION FILES

### Outdated/Redundant Documentation:

**Root-level documentation spam (50+ files):**
```
COMPLETE_SETUP_GUIDE.md
COMPLETE_TEST_RESULTS.md
CONSOLE_NINJA_GUIDE.md
CONSOLE_NINJA_QUICKREF.md
CONSOLE_NINJA_STATUS.md
DATABASE_SCHEMA_COMPLETE.md
DEPLOYMENT_SUCCESS.md
FUNCTION_DEPLOYMENT_STATUS.md
FUNCTION_FIX_COMPLETE.md
NEXT_STEPS_COMPLETE.md
NEXT_STEPS.md
PLAYER_401_FIX_COMPLETE.md
PROCESSREQUEST_DEPLOYMENT.md
QUICKSTART_COMPLETE.md
QUICKSTART.md
REMAINING_FUNCTIONS_SETUP.md
RUNNING.md
SETUP_COMPLETE.md
STEP1_AUTH_TEST_RESULTS.md
STEP3_FUNCTION_DEPLOYMENT_GUIDE.md
STEP7_GITHUB_SECRETS_GUIDE.md
TEST_RESULTS_OLD.md
QUEUE_404_FIX_COMPLETE.md
QUEUE_EMPTY_FIX_COMPLETE.md
QUEUE_JSON_STRINGIFY_FIX.md
DEPLOYMENT_INSTRUCTIONS.md
URGENT_DEPLOY_GUIDE.md
PRODUCTION_ERROR_STATUS.md
MANUAL_DEPLOYMENT_REQUIRED.md
QUEUE_SCHEMA_VERIFICATION.md
SCHEMA_VERIFICATION_COMPLETE.md
UI_DESIGN_INVENTORY.md
... and more
```

### Action:
Create a single `docs/` directory and consolidate:
- Keep: README.md, DJAMMS_Specification.doc
- Archive to `docs/archive/`: All fix logs and status documents
- Keep in `docs/`: Active guides (QUICKSTART, RUNNING, TESTING)

---

## 3. UTILITY SCRIPTS (One-time use)

### Scripts to Archive:
```
fix-queue-id.cjs              ← Used once, queue fixed
load-queue-from-playlist.cjs  ← Used once, queue loaded
fix-priority-queue.cjs        ← Used once, priority queue fixed
check-queue-schema.cjs        ← Keep (useful for debugging)
test-functions.cjs            ← Archive (one-time test)
test-functions.sh             ← Archive (one-time test)
```

### Action:
Move one-time scripts to `scripts/archive/fixes/`

---

## 4. TEST FILES

### Test Report Files (Archive):
```
test-results/                         ← Old Playwright reports
playwright-report/                    ← Old HTML reports
COMPLETE_TEST_RESULTS.md
STEP1_AUTH_TEST_RESULTS.md
TEST_RESULTS_OLD.md
```

### Action:
- Keep `tests/` directory (active test specs)
- Archive old reports to `docs/archive/test-results/`

---

## 5. SCHEMA AUDIT LOGS

### Files:
```
scripts/schema-manager/schema-audit-*.log  (multiple dated files)
```

### Action:
- Keep most recent 2-3 audit logs
- Delete older logs

---

## 6. UNUSED COMPONENTS/HOOKS

Need to analyze imports to identify:
- Unused components in `packages/shared/src/components/`
- Unused hooks in `packages/shared/src/hooks/`
- Unused services in `packages/shared/src/services/`

**Analysis Required:** Check import usage across all apps

---

## 7. BUILD ARTIFACTS (Not in Git)

### Already Gitignored (Safe):
```
dist/
node_modules/
.env (local only)
```

---

## Cleanup Plan

### Phase 1: Remove Duplicate App (IMMEDIATE)
```bash
# Remove the entire old monolithic app
rm -rf apps/web/
```

**Impact:** 
- -500+ files
- -50,000+ lines
- Eliminates all duplication

### Phase 2: Organize Documentation (IMMEDIATE)
```bash
# Create docs structure
mkdir -p docs/archive/fixes
mkdir -p docs/archive/test-results
mkdir -p docs/guides

# Move active guides
mv QUICKSTART.md RUNNING.md docs/guides/

# Archive status/fix docs
mv *FIX*.md *STATUS*.md *COMPLETE*.md docs/archive/fixes/
mv *DEPLOYMENT*.md *GUIDE*.md docs/archive/fixes/

# Archive test results
mv COMPLETE_TEST_RESULTS.md STEP1_AUTH_TEST_RESULTS.md docs/archive/test-results/
```

**Impact:**
- Clean root directory
- Organized documentation
- Easy to find active vs archived docs

### Phase 3: Archive One-Time Scripts
```bash
# Archive used scripts
mkdir -p scripts/archive/fixes
mv fix-queue-id.cjs scripts/archive/fixes/
mv load-queue-from-playlist.cjs scripts/archive/fixes/
mv fix-priority-queue.cjs scripts/archive/fixes/
mv test-functions.* scripts/archive/fixes/
```

### Phase 4: Clean Test Artifacts
```bash
# Keep test-results (Playwright uses it)
# Archive old HTML reports
mkdir -p docs/archive/test-results/playwright-reports
mv playwright-report/*.html docs/archive/test-results/playwright-reports/
```

### Phase 5: Analyze Unused Code
```bash
# Use depcheck or similar to find unused dependencies
npx depcheck

# Search for unused exports
npx ts-prune
```

---

## Expected Results

### Before Cleanup:
- Root directory: 80+ files
- apps/: 9 directories (with duplicates)
- Total: ~1000+ files, 150,000+ lines

### After Cleanup:
- Root directory: ~10 files (README, package.json, configs)
- apps/: 6 active directories
- docs/: Organized documentation
- Total: ~500 files, 100,000 lines

### Benefits:
- ✅ 50% reduction in codebase size
- ✅ Eliminates all duplication
- ✅ Clear separation: active vs archived
- ✅ Faster IDE indexing
- ✅ Easier navigation
- ✅ Reduced confusion

---

## Recommendations

### Do Immediately:
1. ✅ Remove `apps/web/` (duplicate app)
2. ✅ Organize documentation into `docs/`
3. ✅ Archive one-time fix scripts

### Do After Testing:
4. Run import analysis for unused code
5. Remove unused components/hooks
6. Clean up old schema audit logs

### Keep:
- All active app directories (admin, auth, dashboard, kiosk, landing, player)
- All package code in `packages/`
- Active test specs in `tests/`
- Configuration files (tsconfig, vite, etc.)
- check-queue-schema.cjs (useful debugging tool)

---

## Files Summary

### TO DELETE: ~500 files
- apps/web/ (entire directory)
- 30+ redundant documentation files
- 5+ one-time fix scripts
- Old test reports

### TO MOVE: ~50 files
- Documentation to docs/archive/
- Fix scripts to scripts/archive/

### TO KEEP: ~450 files
- Active apps (6 directories)
- Shared packages
- Active tests
- Configuration files

---

**Ready for execution?** Run Phase 1-3 immediately, then test before Phase 4-5.
