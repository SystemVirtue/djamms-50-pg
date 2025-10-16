# 📚 Documentation Map

**Last Updated:** October 16, 2025  
**Total Documents:** 40 markdown files  
**Status:** ✅ Organized & Current

---

## 🎯 Quick Navigation

| I need to... | Go to... |
|--------------|----------|
| **Get started quickly** | [Quick Start](./docs/setup/QUICKSTART.md) |
| **Understand the system** | [Architecture](./docs/architecture/ARCHITECTURE.md) |
| **Deploy to production** | [Deployment Guide](./docs/setup/DEPLOYMENT.md) |
| **Configure environment** | [Configuration](./docs/setup/CONFIGURATION.md) |
| **Find API endpoints** | [API Docs](./API_DOCS.md) |
| **Fix a problem** | [Troubleshooting](#troubleshooting) |
| **View production URLs** | [Production Links](./PRODUCTION_APP_LINKS.md) |

---

## 📖 Documentation Structure

```
docs/
├── architecture/        # System design & technical specs
│   ├── ARCHITECTURE.md ⭐ Main architecture document
│   ├── DATABASE_SCHEMA_COMPLETE.md
│   ├── AUTHENTICATION_FLOW.md
│   ├── CALLBACK_PAGE_EXPLANATION.md
│   └── PLAYLIST_INTEGRATION_GUIDE.md
│
├── setup/              # Getting started & deployment
│   ├── QUICKSTART.md ⭐ Get running in 5 minutes
│   ├── DEPLOYMENT.md ⭐ Production deployment
│   ├── CONFIGURATION.md ⭐ Environment variables
│   └── PORKBUN_EMAIL_DNS_GUIDE.md
│
├── reference/          # Commands, APIs, tools
│   ├── QUICK_REFERENCE.md
│   ├── RUNNING.md
│   ├── CONSOLE_NINJA.md
│   └── DEPENDENCY_HEALTH_REPORT.md
│
└── troubleshooting/   # Common issues & fixes
    └── (organized by topic)
```

⭐ = **Essential documents** - Start here!

---

## 📚 Complete Document Index

### Root Directory

| File | Purpose | Audience |
|------|---------|----------|
| **README.md** | Project overview & quick links | Everyone |
| **API_DOCS.md** | Complete API reference | Developers |
| **PRODUCTION_APP_LINKS.md** | All production URLs & test cases | QA, Ops |
| **MD_FILE_ANALYSIS.md** | Markdown cleanup analysis | Maintainers |
| **STEP3_CONSOLIDATION_COMPLETE.md** | Setup consolidation report | Maintainers |

### Architecture Documentation

#### System Design

- **[ARCHITECTURE.md](./docs/architecture/ARCHITECTURE.md)** ⭐
  - **Purpose:** Complete system architecture overview
  - **Contains:** Tech stack, data flow, components, deployment
  - **Audience:** Developers, architects, stakeholders
  - **When to use:** Understanding how the system works
  - **Related:** DATABASE_SCHEMA_COMPLETE.md

- **[DATABASE_SCHEMA_COMPLETE.md](./docs/architecture/DATABASE_SCHEMA_COMPLETE.md)**
  - **Purpose:** Detailed database schema documentation
  - **Contains:** All 7 collections, fields, types, indexes
  - **Audience:** Backend developers, DBAs
  - **When to use:** Working with database operations
  - **Related:** ARCHITECTURE.md

#### Authentication & Security

- **[AUTHENTICATION_FLOW.md](./docs/architecture/AUTHENTICATION_FLOW.md)**
  - **Purpose:** Magic link authentication process
  - **Contains:** Flow diagrams, JWT handling, session management
  - **Audience:** Security engineers, backend developers
  - **When to use:** Implementing/debugging auth
  - **Related:** CALLBACK_PAGE_EXPLANATION.md

- **[CALLBACK_PAGE_EXPLANATION.md](./docs/architecture/CALLBACK_PAGE_EXPLANATION.md)**
  - **Purpose:** Auth callback handling details
  - **Contains:** Token validation, redirect logic
  - **Audience:** Frontend developers
  - **When to use:** Working on auth flow
  - **Related:** AUTHENTICATION_FLOW.md

#### Features

- **[PLAYLIST_INTEGRATION_GUIDE.md](./docs/architecture/PLAYLIST_INTEGRATION_GUIDE.md)**
  - **Purpose:** Playlist management system
  - **Contains:** CRUD operations, queue integration
  - **Audience:** Feature developers
  - **When to use:** Implementing playlist features
  - **Related:** DATABASE_SCHEMA_COMPLETE.md

### Setup & Deployment

#### Getting Started

- **[QUICKSTART.md](./docs/setup/QUICKSTART.md)** ⭐
  - **Purpose:** Get running locally in < 5 minutes
  - **Contains:** Installation, configuration, first run
  - **Audience:** New developers
  - **When to use:** First time setup
  - **Related:** CONFIGURATION.md

- **[CONFIGURATION.md](./docs/setup/CONFIGURATION.md)** ⭐
  - **Purpose:** Complete environment variable reference
  - **Contains:** All env vars, AppWrite config, API keys
  - **Audience:** DevOps, developers
  - **When to use:** Setting up environment
  - **Related:** DEPLOYMENT.md

#### Production Deployment

- **[DEPLOYMENT.md](./docs/setup/DEPLOYMENT.md)** ⭐
  - **Purpose:** Deploy to production (AppWrite)
  - **Contains:** Build process, DNS config, SSL setup
  - **Audience:** DevOps, SRE
  - **When to use:** Production deployment
  - **Related:** CONFIGURATION.md, PORKBUN_EMAIL_DNS_GUIDE.md

- **[PORKBUN_EMAIL_DNS_GUIDE.md](./docs/setup/PORKBUN_EMAIL_DNS_GUIDE.md)**
  - **Purpose:** DNS and email configuration
  - **Contains:** Porkbun DNS records, Resend setup
  - **Audience:** DevOps
  - **When to use:** Configuring domain/email
  - **Related:** DEPLOYMENT.md

### Reference Documentation

#### Development Commands

- **[RUNNING.md](./docs/reference/RUNNING.md)**
  - **Purpose:** How to run the project
  - **Contains:** npm scripts, development commands
  - **Audience:** Developers
  - **When to use:** Daily development
  - **Related:** QUICKSTART.md

- **[QUICK_REFERENCE.md](./docs/reference/QUICK_REFERENCE.md)**
  - **Purpose:** Common commands & tasks
  - **Contains:** Quick copy-paste commands
  - **Audience:** Developers
  - **When to use:** Quick lookups
  - **Related:** RUNNING.md

#### Tools & Utilities

- **[CONSOLE_NINJA.md](./docs/reference/CONSOLE_NINJA.md)**
  - **Purpose:** Real-time debugging tool setup
  - **Contains:** Installation, usage, features
  - **Audience:** Developers
  - **When to use:** Debugging runtime issues
  - **Related:** None

- **[DEPENDENCY_HEALTH_REPORT.md](./docs/reference/DEPENDENCY_HEALTH_REPORT.md)**
  - **Purpose:** Package health & security status
  - **Contains:** Dependency audit, vulnerabilities
  - **Audience:** Maintainers, DevOps
  - **When to use:** Dependency updates
  - **Related:** None

### Testing Documentation

#### Test Guides

- **[E2E_TESTING_GUIDE.md](./E2E_TESTING_GUIDE.md)**
  - **Purpose:** End-to-end testing with Playwright
  - **Contains:** Test setup, writing tests, CI/CD
  - **Audience:** QA engineers, developers
  - **When to use:** Writing/running E2E tests
  - **Related:** TESTING_GUIDE.md

- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)**
  - **Purpose:** Overall testing strategy
  - **Contains:** Unit, integration, E2E testing
  - **Audience:** QA engineers, developers
  - **When to use:** Understanding test coverage
  - **Related:** E2E_TESTING_GUIDE.md

- **[MANUAL_TESTING_GUIDE.md](./MANUAL_TESTING_GUIDE.md)**
  - **Purpose:** Manual QA test scenarios
  - **Contains:** Test cases, expected results
  - **Audience:** QA engineers
  - **When to use:** Manual testing sessions
  - **Related:** PRODUCTION_APP_LINKS.md

#### App-Specific Testing

- **[apps/player/TESTING_GUIDE.md](./apps/player/TESTING_GUIDE.md)**
  - **Purpose:** Player-specific testing
  - **Contains:** Player test scenarios
  - **Audience:** Developers, QA
  - **When to use:** Testing player functionality
  - **Related:** E2E_TESTING_GUIDE.md

- **[apps/kiosk/TESTING_GUIDE.md](./apps/kiosk/TESTING_GUIDE.md)**
  - **Purpose:** Kiosk-specific testing
  - **Contains:** Kiosk test scenarios
  - **Audience:** Developers, QA
  - **When to use:** Testing kiosk functionality
  - **Related:** E2E_TESTING_GUIDE.md

### Function Documentation

Each Cloud Function has its own README:

- **[functions/appwrite/functions/magic-link/README.md](./functions/appwrite/functions/magic-link/README.md)**
  - **Purpose:** Magic link authentication function
  - **Contains:** Implementation, deployment, testing
  - **Audience:** Backend developers
  
- **[functions/appwrite/functions/player-registry/README.md](./functions/appwrite/functions/player-registry/README.md)**
  - **Purpose:** Master player registry function
  - **Contains:** Player management logic
  - **Audience:** Backend developers
  
- **[functions/appwrite/functions/processRequest/README.md](./functions/appwrite/functions/processRequest/README.md)**
  - **Purpose:** Song request processing function
  - **Contains:** Request handling logic
  - **Audience:** Backend developers

### Monitoring & Operations

- **[MONITORING_AND_LAUNCH_GUIDE.md](./MONITORING_AND_LAUNCH_GUIDE.md)**
  - **Purpose:** Production monitoring setup
  - **Contains:** Metrics, alerts, dashboards
  - **Audience:** SRE, DevOps
  - **When to use:** Setting up monitoring
  - **Related:** DEPLOYMENT.md

- **[CAA_RECORDS_GUIDE.md](./CAA_RECORDS_GUIDE.md)**
  - **Purpose:** SSL certificate authority configuration
  - **Contains:** CAA DNS records for Let's Encrypt
  - **Audience:** DevOps
  - **When to use:** SSL troubleshooting
  - **Related:** DEPLOYMENT.md

### Cleanup & Maintenance

- **[MD_FILE_ANALYSIS.md](./MD_FILE_ANALYSIS.md)**
  - **Purpose:** Documentation cleanup analysis
  - **Contains:** Categorization, deletion plan
  - **Audience:** Maintainers
  - **When to use:** Documentation maintenance
  - **Related:** STEP3_CONSOLIDATION_COMPLETE.md

- **[FILE_CLEANUP_SUMMARY.md](./FILE_CLEANUP_SUMMARY.md)**
  - **Purpose:** Previous cleanup record
  - **Contains:** Historical cleanup actions
  - **Audience:** Maintainers
  - **Related:** MD_FILE_ANALYSIS.md

- **[ENV_CLEANUP_COMPLETE.md](./ENV_CLEANUP_COMPLETE.md)**
  - **Purpose:** Environment variable cleanup record
  - **Contains:** Env var standardization history
  - **Audience:** Maintainers
  - **Related:** CONFIGURATION.md

- **[MIGRATION_CHANGELOG.md](./MIGRATION_CHANGELOG.md)**
  - **Purpose:** Migration history (Vercel → AppWrite)
  - **Contains:** Migration steps, issues resolved
  - **Audience:** Maintainers, architects
  - **Related:** DEPLOYMENT.md

### UI/UX Documentation

- **[UI_DESIGN_INVENTORY.md](./UI_DESIGN_INVENTORY.md)**
  - **Purpose:** UI component inventory
  - **Contains:** Component library, design system
  - **Audience:** Frontend developers, designers
  - **Related:** None

- **[ADMIN_GUIDE.md](./ADMIN_GUIDE.md)**
  - **Purpose:** Admin panel user guide
  - **Contains:** Admin features, workflows
  - **Audience:** End users, trainers
  - **Related:** PRODUCTION_APP_LINKS.md

---

## 🔍 Finding What You Need

### By Role

**New Developer:**
1. [README.md](./README.md) - Overview
2. [QUICKSTART.md](./docs/setup/QUICKSTART.md) - Get started
3. [ARCHITECTURE.md](./docs/architecture/ARCHITECTURE.md) - Understand system
4. [RUNNING.md](./docs/reference/RUNNING.md) - Development workflow

**Backend Developer:**
1. [DATABASE_SCHEMA_COMPLETE.md](./docs/architecture/DATABASE_SCHEMA_COMPLETE.md)
2. [AUTHENTICATION_FLOW.md](./docs/architecture/AUTHENTICATION_FLOW.md)
3. [Function READMEs](./functions/appwrite/functions/)
4. [API_DOCS.md](./API_DOCS.md)

**DevOps/SRE:**
1. [DEPLOYMENT.md](./docs/setup/DEPLOYMENT.md)
2. [CONFIGURATION.md](./docs/setup/CONFIGURATION.md)
3. [MONITORING_AND_LAUNCH_GUIDE.md](./MONITORING_AND_LAUNCH_GUIDE.md)
4. [PORKBUN_EMAIL_DNS_GUIDE.md](./docs/setup/PORKBUN_EMAIL_DNS_GUIDE.md)

**QA Engineer:**
1. [TESTING_GUIDE.md](./TESTING_GUIDE.md)
2. [E2E_TESTING_GUIDE.md](./E2E_TESTING_GUIDE.md)
3. [MANUAL_TESTING_GUIDE.md](./MANUAL_TESTING_GUIDE.md)
4. [PRODUCTION_APP_LINKS.md](./PRODUCTION_APP_LINKS.md)

### By Task

**"I want to run the project locally"**
→ [QUICKSTART.md](./docs/setup/QUICKSTART.md)

**"I need to deploy to production"**
→ [DEPLOYMENT.md](./docs/setup/DEPLOYMENT.md)

**"How do I configure AppWrite?"**
→ [CONFIGURATION.md](./docs/setup/CONFIGURATION.md)

**"What's the database schema?"**
→ [DATABASE_SCHEMA_COMPLETE.md](./docs/architecture/DATABASE_SCHEMA_COMPLETE.md)

**"How does authentication work?"**
→ [AUTHENTICATION_FLOW.md](./docs/architecture/AUTHENTICATION_FLOW.md)

**"Where are the API endpoints?"**
→ [API_DOCS.md](./API_DOCS.md)

**"How do I test my changes?"**
→ [TESTING_GUIDE.md](./TESTING_GUIDE.md)

**"What are the production URLs?"**
→ [PRODUCTION_APP_LINKS.md](./PRODUCTION_APP_LINKS.md)

**"Something's broken, help!"**
→ [TROUBLESHOOTING.md](./docs/troubleshooting/) (by topic)

---

## 📊 Document Statistics

| Category | Count | Status |
|----------|-------|--------|
| **Architecture** | 5 docs | ✅ Current |
| **Setup/Deploy** | 4 docs | ✅ Current |
| **Reference** | 4 docs | ✅ Current |
| **Testing** | 5 docs | ✅ Current |
| **Functions** | 3 docs | ✅ Current |
| **Operations** | 3 docs | ✅ Current |
| **Cleanup** | 4 docs | ✅ Historical |
| **UI/Admin** | 2 docs | ✅ Current |
| **Root Files** | 5 docs | ✅ Current |
| **Troubleshooting** | varies | ✅ Current |

**Total:** ~40 documents  
**Reduction:** 140 → 40 (71% reduction)  
**Status:** ✅ Organized & maintained

---

## 🔄 Document Lifecycle

### Active Documents
Updated regularly, reflect current system:
- Architecture docs
- Setup/deployment guides
- API reference
- Testing guides

### Historical Documents
Kept for reference, not updated:
- Cleanup summaries
- Migration changelogs
- Completion reports (archived)

### Deprecated Documents
**None** - All obsolete docs have been removed (see MD_FILE_ANALYSIS.md)

---

## 🆘 Can't Find What You Need?

1. **Check this map** - Ctrl+F to search
2. **Check README.md** - High-level overview
3. **Check ARCHITECTURE.md** - Technical deep dive
4. **Ask in GitHub Issues** - We'll help & update docs
5. **Grep the docs** - `grep -r "your_topic" docs/`

---

## 🔧 Maintaining This Documentation

### When to Update This Map

- ✅ New document added
- ✅ Document moved/renamed
- ✅ Document archived/deleted
- ✅ Major content changes

### How to Update

1. Edit this file
2. Update "Last Updated" date
3. Update document counts
4. Commit with message: `docs: Update documentation map`

---

**Maintained By:** SystemVirtue  
**Questions?** Open an issue on GitHub

---

**[⬆ back to top](#-documentation-map)**
