# Production Monitoring & Launch Guide 🚀

**Task 14 of 14 - FINAL TASK**

## Overview

This guide covers setting up comprehensive monitoring, analytics, error tracking, and uptime monitoring for the DJAMMS platform. It includes a complete pre-launch checklist and post-launch procedures.

## Monitoring Stack

### Architecture

```
┌────────────────────────────────────────────────────┐
│              MONITORING ARCHITECTURE               │
└────────────────────────────────────────────────────┘

Error Tracking (Sentry)
  ├─ Runtime errors
  ├─ API failures
  ├─ Performance issues
  └─ Source maps for debugging

Analytics (Plausible/Google Analytics)
  ├─ Page views
  ├─ User journeys
  ├─ Conversion tracking
  └─ Custom events

Uptime Monitoring (UptimeRobot)
  ├─ HTTP(S) checks
  ├─ Response time tracking
  ├─ SSL certificate monitoring
  └─ Email/SMS alerts

Performance (Vercel Analytics)
  ├─ Core Web Vitals
  ├─ Real User Monitoring (RUM)
  ├─ Build analytics
  └─ Function metrics

Application Logs (Console + AppWrite)
  ├─ Request logs
  ├─ Database operations
  ├─ Authentication events
  └─ Payment transactions
```

## Part 1: Error Tracking with Sentry

### Setup Sentry

1. **Create Account**: https://sentry.io
2. **Create Organization**: "DJAMMS"
3. **Create Projects** (one per app):
   - djamms-landing
   - djamms-auth
   - djamms-player
   - djamms-kiosk
   - djamms-admin
   - djamms-dashboard

### Install Sentry SDK

```bash
npm install --save @sentry/react @sentry/vite-plugin
```

### Configure Sentry for React Apps

Create `packages/shared/src/utils/sentry.ts`:

```typescript
import * as Sentry from '@sentry/react';

export function initSentry(appName: string) {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      
      // Performance Monitoring
      tracesSampleRate: 1.0, // 100% in production (adjust based on volume)
      
      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% when error occurs
      
      // App metadata
      release: `${appName}@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
      
      // Filter sensitive data
      beforeSend(event, hint) {
        // Remove sensitive info from URLs
        if (event.request?.url) {
          event.request.url = event.request.url.replace(/token=[^&]+/, 'token=REDACTED');
        }
        return event;
      },
    });
  }
}

export { Sentry };
```

### Add to Each App's main.tsx

Example for `apps/player/src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initSentry } from '@shared/utils/sentry';

// Initialize Sentry
initSentry('player');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Environment Variables

Add to Vercel for each project:

```bash
VITE_SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[project-id]
VITE_APP_VERSION=1.0.0
```

### Error Boundaries

Wrap apps with Sentry error boundary:

```typescript
import { Sentry } from '@shared/utils/sentry';

function App() {
  return (
    <Sentry.ErrorBoundary 
      fallback={({ error, resetError }) => (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="max-w-md p-8 bg-gray-800 rounded-lg">
            <h1 className="text-2xl font-bold text-red-500 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-300 mb-4">
              {error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={resetError}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
      showDialog
    >
      <YourApp />
    </Sentry.ErrorBoundary>
  );
}
```

### Custom Error Tracking

Add to services for granular tracking:

```typescript
import { Sentry } from '@shared/utils/sentry';

// Track database errors
try {
  await databases.getDocument(/* ... */);
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      service: 'database',
      operation: 'getDocument',
      collection: 'requests'
    },
    extra: {
      venueId,
      requestId
    }
  });
  throw error;
}

// Track API errors
Sentry.captureMessage('API rate limit exceeded', {
  level: 'warning',
  tags: { api: 'youtube' }
});

// Track performance
const transaction = Sentry.startTransaction({ name: 'queue-sync' });
try {
  await syncQueue();
} finally {
  transaction.finish();
}
```

## Part 2: Analytics Setup

### Option A: Plausible Analytics (Privacy-Focused)

**Why Plausible:**
- ✅ Privacy-friendly (no cookies, GDPR compliant)
- ✅ Lightweight (~1KB script)
- ✅ Simple dashboard
- ✅ No impact on page speed

**Setup:**

1. Create account: https://plausible.io
2. Add sites:
   - djamms.app
   - auth.djamms.app
   - player.djamms.app
   - kiosk.djamms.app
   - admin.djamms.app
   - dashboard.djamms.app

3. Add script to each app's `index.html`:

```html
<script defer data-domain="djamms.app" src="https://plausible.io/js/script.js"></script>
```

4. Track custom events:

```typescript
// In your components
function trackEvent(name: string, props?: Record<string, string>) {
  if (window.plausible) {
    window.plausible(name, { props });
  }
}

// Usage
trackEvent('Song Request', { 
  venue: venueId,
  paid: isPaid ? 'yes' : 'no'
});

trackEvent('Payment Completed', {
  amount: amount.toString(),
  venue: venueId
});
```

### Option B: Google Analytics 4

**Setup:**

1. Create GA4 property: https://analytics.google.com
2. Get measurement ID (G-XXXXXXXXXX)

3. Install gtag:

```bash
npm install --save-dev @types/gtag.js
```

4. Add to each app's `index.html`:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

5. Track events:

```typescript
// In your components
function trackGA(action: string, params?: Record<string, any>) {
  if (window.gtag) {
    window.gtag('event', action, params);
  }
}

// Usage
trackGA('song_request', {
  venue_id: venueId,
  is_paid: isPaid,
  category: 'engagement'
});
```

### Recommended Events to Track

```typescript
// Kiosk events
trackEvent('search_performed', { query, venue });
trackEvent('song_requested', { videoId, paid, venue });
trackEvent('payment_initiated', { amount, venue });
trackEvent('payment_completed', { amount, venue });

// Player events
trackEvent('track_started', { videoId, venue });
trackEvent('track_completed', { videoId, venue });
trackEvent('track_skipped', { videoId, venue });

// Admin events
trackEvent('queue_reordered', { venue });
trackEvent('request_cancelled', { venue });
trackEvent('analytics_viewed', { venue });

// Auth events
trackEvent('magic_link_requested', { email });
trackEvent('login_completed', { method: 'magic_link' });
```

## Part 3: Uptime Monitoring

### UptimeRobot Setup (Free)

1. **Create Account**: https://uptimerobot.com
2. **Add Monitors**:

```
Monitor Type: HTTPS
URLs to Monitor:
├─ https://djamms.app (check every 5 min)
├─ https://auth.djamms.app (check every 5 min)
├─ https://player.djamms.app (check every 5 min)
├─ https://kiosk.djamms.app (check every 5 min)
├─ https://admin.djamms.app (check every 5 min)
└─ https://dashboard.djamms.app (check every 5 min)
```

3. **Configure Alerts**:
   - Email notifications
   - SMS (optional, paid)
   - Webhook to Slack/Discord

4. **Status Page** (Optional):
   - Create public status page
   - Show uptime percentage
   - Display incident history

### Alternative: Pingdom

More features but paid after trial:
- Transaction monitoring
- Page speed monitoring
- Real browser testing
- Custom locations

## Part 4: Performance Monitoring

### Vercel Analytics (Built-in)

Enable for all projects:

1. Go to Vercel Dashboard → Project → Analytics
2. Enable **Web Analytics**
3. Enable **Speed Insights**

**Metrics Tracked:**
- Page views
- Unique visitors
- Top pages
- Referrers
- Core Web Vitals (LCP, FID, CLS)
- Real user performance data

### Web Vitals Tracking

Add to each app's `main.tsx`:

```typescript
import { onCLS, onFID, onLCP } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Send to your analytics endpoint
  console.log(metric.name, metric.value);
  
  // Or send to Sentry
  if (import.meta.env.PROD) {
    Sentry.captureMessage(`WebVital: ${metric.name}`, {
      level: 'info',
      tags: {
        metric: metric.name,
        rating: metric.rating
      },
      extra: {
        value: metric.value,
        id: metric.id
      }
    });
  }
}

onCLS(sendToAnalytics);
onFID(sendToAnalytics);
onLCP(sendToAnalytics);
```

### Performance Targets

**Core Web Vitals:**
- LCP (Largest Contentful Paint): <2.5s
- FID (First Input Delay): <100ms
- CLS (Cumulative Layout Shift): <0.1

**Additional Metrics:**
- First Contentful Paint: <1.5s
- Time to Interactive: <3.5s
- Total Blocking Time: <200ms

## Part 5: Application Logging

### Structured Logging

Create `packages/shared/src/utils/logger.ts`:

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  service?: string;
  operation?: string;
  venueId?: string;
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

class Logger {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service: this.serviceName,
      message,
      ...context
    };

    // Console output
    const method = level === 'error' ? 'error' : 
                   level === 'warn' ? 'warn' : 'log';
    console[method](`[${level.toUpperCase()}]`, message, context || '');

    // Send to external service in production
    if (import.meta.env.PROD && (level === 'error' || level === 'warn')) {
      // Send to Sentry or logging service
      if (level === 'error') {
        Sentry.captureMessage(message, {
          level: 'error',
          extra: context
        });
      }
    }

    return logEntry;
  }

  debug(message: string, context?: LogContext) {
    if (!import.meta.env.PROD) {
      this.log('debug', message, context);
    }
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log('error', message, {
      ...context,
      error: error?.message,
      stack: error?.stack
    });
  }
}

export function createLogger(serviceName: string) {
  return new Logger(serviceName);
}
```

### Usage in Services

```typescript
import { createLogger } from '@shared/utils/logger';

const logger = createLogger('RequestHistoryService');

class RequestHistoryService {
  async logRequest(request: Omit<SongRequest, 'requestId'>) {
    try {
      logger.info('Logging new request', {
        operation: 'logRequest',
        venueId: request.venueId,
        requesterId: request.requesterId,
        isPaid: !!request.paymentId
      });

      const document = await this.databases.createDocument(/* ... */);
      
      logger.info('Request logged successfully', {
        operation: 'logRequest',
        requestId: document.$id
      });

      return document;
    } catch (error) {
      logger.error('Failed to log request', error as Error, {
        operation: 'logRequest',
        venueId: request.venueId
      });
      throw error;
    }
  }
}
```

## Part 6: Alerting & Notifications

### Critical Alerts

Set up alerts for:

1. **Application Errors**
   - Sentry: Alert on new issues
   - Threshold: >10 errors/hour

2. **Downtime**
   - UptimeRobot: Alert immediately
   - SMS for critical apps (player, kiosk)

3. **Performance Degradation**
   - Vercel: Alert on slow deployments
   - Core Web Vitals below targets

4. **Database Issues**
   - AppWrite: Monitor error rates
   - Alert on connection failures

### Slack Integration

Create webhook for notifications:

```typescript
async function sendSlackAlert(message: string, severity: 'info' | 'warning' | 'error') {
  const color = severity === 'error' ? 'danger' : 
                severity === 'warning' ? 'warning' : 'good';

  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attachments: [{
        color,
        title: `DJAMMS ${severity.toUpperCase()}`,
        text: message,
        ts: Math.floor(Date.now() / 1000)
      }]
    })
  });
}

// Usage
sendSlackAlert('Player app experiencing high error rate', 'error');
```

## Part 7: Pre-Launch Checklist

### Technical Checklist

#### Infrastructure
- [ ] All 6 apps deployed to Vercel
- [ ] Custom domains configured and SSL active
- [ ] DNS propagation complete
- [ ] Environment variables set for all apps
- [ ] AppWrite production database deployed
- [ ] AppWrite domains whitelisted

#### Monitoring
- [ ] Sentry configured for all apps
- [ ] Source maps uploaded
- [ ] Error boundaries implemented
- [ ] Analytics tracking code added
- [ ] Uptime monitoring active
- [ ] Alert notifications configured
- [ ] Performance monitoring enabled

#### Security
- [ ] All API keys secured in environment variables
- [ ] No sensitive data in frontend code
- [ ] HTTPS enforced on all domains
- [ ] CORS configured correctly
- [ ] Rate limiting enabled in AppWrite
- [ ] Content Security Policy headers set
- [ ] Stripe webhook signature verification

#### Testing
- [ ] End-to-end flow tested in production
- [ ] All authentication flows work
- [ ] Payment processing tested (test mode first)
- [ ] Mobile responsive verified
- [ ] Cross-browser testing complete
- [ ] Performance scores acceptable (>90)
- [ ] Accessibility audit passed

#### Data & Backup
- [ ] Database backup strategy defined
- [ ] Data retention policies set
- [ ] GDPR compliance reviewed
- [ ] Privacy policy published
- [ ] Terms of service published

### Business Checklist

#### Legal & Compliance
- [ ] Privacy policy finalized
- [ ] Terms of service finalized
- [ ] Cookie policy (if using cookies)
- [ ] GDPR compliance documented
- [ ] Stripe account verified and approved

#### Marketing
- [ ] Landing page content finalized
- [ ] SEO meta tags added to all pages
- [ ] Open Graph tags for social sharing
- [ ] Favicon and app icons added
- [ ] Social media accounts created
- [ ] Launch announcement prepared
- [ ] Email templates ready

#### Support
- [ ] Support email configured (support@djamms.app)
- [ ] Help documentation written
- [ ] FAQ page created
- [ ] Contact form functional
- [ ] Support ticket system (optional)

#### Analytics & Goals
- [ ] Key metrics defined
- [ ] Conversion goals set in analytics
- [ ] Revenue tracking configured
- [ ] User journey mapping complete

## Part 8: Launch Day Procedures

### Launch Sequence

```bash
# T-minus 1 hour: Final Checks
1. Verify all services are up
2. Check error rates in Sentry
3. Confirm monitoring alerts are active
4. Test critical user flows one more time

# T-minus 30 minutes: Team Briefing
5. All team members on standby
6. Communication channels open (Slack)
7. Rollback procedures reviewed

# T-minus 10 minutes: Final Deploy
8. Deploy any last-minute fixes
9. Warm up services (make test requests)
10. Clear caches

# T-0: LAUNCH! 🚀
11. Switch DNS to production (if not already)
12. Send launch announcement
13. Monitor dashboards actively
14. Respond to any issues immediately

# T+1 hour: First Check-in
15. Review error logs
16. Check performance metrics
17. Monitor user signups/activity
18. Verify payment processing

# T+24 hours: Post-Launch Review
19. Analyze first day metrics
20. Address any reported issues
21. Optimize based on real usage
22. Celebrate! 🎉
```

### Launch Announcement Template

**Email/Social Media:**

```
🎉 Introducing DJAMMS - The Modern Jukebox for Bars & Venues!

Turn your venue's music into an interactive experience:
✨ Customers request songs from their phones
🎵 Seamless YouTube integration
💳 Accept paid priority requests
📊 Real-time analytics for venue owners

Try it now: https://djamms.app

#MusicTech #Hospitality #Innovation
```

## Part 9: Post-Launch Monitoring

### First Week Focus

**Day 1-7:**
- Monitor error rates hourly
- Check uptime every 2 hours
- Review user feedback daily
- Track key metrics:
  - New user signups
  - Song requests per venue
  - Payment conversion rate
  - Average session duration
  - Bounce rate

### Key Metrics Dashboard

Create monitoring dashboard with:

```
┌─────────────────────────────────────────┐
│        DJAMMS Health Dashboard          │
├─────────────────────────────────────────┤
│ Uptime (24h)              99.9%    ✅  │
│ Error Rate                0.02%    ✅  │
│ Avg Response Time         245ms    ✅  │
│ Active Venues             12       📈  │
│ Requests Today            487      📈  │
│ Revenue (24h)             $127     💰  │
│ Core Web Vitals           95/100   ✅  │
└─────────────────────────────────────────┘
```

### Weekly Review Checklist

- [ ] Review Sentry errors and fix critical issues
- [ ] Analyze analytics for user behavior patterns
- [ ] Check uptime reports and identify any downtime
- [ ] Review performance metrics and optimize if needed
- [ ] Respond to user feedback and support tickets
- [ ] Update documentation based on common questions
- [ ] Plan feature improvements based on data

## Part 10: Incident Response Plan

### Severity Levels

**P0 - Critical (Site Down)**
- Response time: Immediate
- All apps inaccessible
- **Action**: Page on-call engineer, investigate immediately

**P1 - Major (Core Feature Broken)**
- Response time: <15 minutes
- Payments failing, player not working
- **Action**: Investigate and fix within 1 hour

**P2 - Minor (Non-critical Issue)**
- Response time: <2 hours
- Analytics not showing, minor UI bug
- **Action**: Fix within 24 hours

**P3 - Low (Enhancement)**
- Response time: <1 week
- Feature request, cosmetic issue
- **Action**: Add to backlog

### Incident Response Procedure

1. **Detect**: Alert triggers or user report
2. **Assess**: Determine severity level
3. **Communicate**: Update status page, notify users if needed
4. **Investigate**: Check logs, Sentry, monitoring
5. **Fix**: Deploy fix or rollback
6. **Verify**: Confirm issue resolved
7. **Document**: Write incident report
8. **Learn**: Conduct post-mortem if P0/P1

### Rollback Procedure

```bash
# Option 1: Vercel Dashboard
# Go to Deployments → Find last good deployment → Promote

# Option 2: CLI
vercel rollback <previous-deployment-url>

# Option 3: Git revert
git revert HEAD
git push origin main
# Vercel auto-deploys
```

## Part 11: Continuous Improvement

### Monthly Tasks

- [ ] Review and optimize bundle sizes
- [ ] Update dependencies (security patches)
- [ ] Analyze error trends and fix root causes
- [ ] Review and optimize database queries
- [ ] Conduct performance audits
- [ ] Update documentation
- [ ] Review and update monitoring thresholds

### Quarterly Tasks

- [ ] Security audit
- [ ] Penetration testing
- [ ] Disaster recovery drill
- [ ] Load testing
- [ ] User feedback session
- [ ] Feature prioritization review
- [ ] Team retrospective

## Part 12: Success Metrics

### Product Metrics

**Week 1 Targets:**
- [ ] 10+ venue signups
- [ ] 500+ song requests
- [ ] 99.9% uptime
- [ ] <1% error rate
- [ ] <500ms average response time

**Month 1 Targets:**
- [ ] 50+ active venues
- [ ] 5,000+ song requests
- [ ] 99.95% uptime
- [ ] <0.5% error rate
- [ ] $1,000+ in payment processing

**Quarter 1 Targets:**
- [ ] 200+ active venues
- [ ] 50,000+ song requests
- [ ] 99.99% uptime
- [ ] <0.1% error rate
- [ ] $10,000+ in payment processing

### Technical Metrics

**Target KPIs:**
- **Uptime**: >99.9%
- **Error Rate**: <0.5%
- **Response Time**: <300ms (p95)
- **Core Web Vitals**: >90 score
- **Customer Satisfaction**: >4.5/5

## Documentation Created

This guide includes:
- Sentry error tracking setup
- Analytics integration (Plausible/GA4)
- Uptime monitoring (UptimeRobot)
- Performance monitoring (Vercel)
- Structured logging
- Alerting configuration
- Pre-launch checklist
- Launch procedures
- Post-launch monitoring
- Incident response plan
- Success metrics

## Next Steps

1. **Execute Monitoring Setup**
   - Set up Sentry accounts
   - Configure analytics
   - Enable uptime monitoring

2. **Complete Pre-Launch Checklist**
   - Verify all items checked
   - Test all critical flows
   - Prepare launch announcement

3. **LAUNCH! 🚀**
   - Follow launch sequence
   - Monitor actively
   - Celebrate success!

---

**Task 14 Status**: Ready for execution
**Time to Complete**: 3-4 hours
**Result**: Production-ready platform with comprehensive monitoring

## Quick Commands Reference

```bash
# Deploy with monitoring
npm run build
vercel --prod

# Check production logs
vercel logs <deployment-url> --follow

# Test production
curl -I https://djamms.app
curl -I https://player.djamms.app

# Monitor errors
# Visit: sentry.io/organizations/djamms/issues

# Check uptime
# Visit: uptimerobot.com/dashboard

# View analytics
# Visit: plausible.io/djamms.app
```

