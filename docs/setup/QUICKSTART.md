# 🚀 Quick Start Guide# Quick Start Guide



Get DJAMMS running locally in under 5 minutes.## 🚀 Get Started in 5 Minutes



---### 1. Verify Installation ✅



## PrerequisitesDependencies are already installed! You should see `node_modules/` directory.



- **Node.js** 18+ (Check: `node --version`)### 2. Configure Environment (2 minutes)

- **npm** 9+ (Check: `npm --version`)

- **Git** (Check: `git --version`)```bash

# Copy the example environment file

---cp .env.example .env



## 1. Clone & Install (2 minutes)# Edit .env with your editor and add:

# - VITE_APPWRITE_ENDPOINT (your AppWrite URL)

```bash# - VITE_APPWRITE_PROJECT_ID (from AppWrite console)

# Clone the repository# - VITE_APPWRITE_DATABASE_ID (e.g., "djamms_production")

git clone https://github.com/SystemVirtue/djamms-50-pg.git# - VITE_JWT_SECRET (generate with: openssl rand -base64 32)

cd djamms-50-pg```



# Install dependencies### 3. Start Development (1 minute)

npm install

``````bash

# Start the player app (main component)

---npm run dev:player

```

## 2. Configure Environment (2 minutes)

Open http://localhost:3001/player/venue1 in your browser.

```bash

# Copy environment template**Note**: You'll see the PlayerBusyScreen until AppWrite is configured. This is expected!

cp .env.example .env

```### 4. Start Other Apps (Optional)



**Edit `.env` with your AppWrite credentials:**```bash

# In separate terminals:

```bashnpm run dev:auth     # http://localhost:3002

# Required for basic functionalitynpm run dev:admin    # http://localhost:3003

VITE_APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1npm run dev:kiosk    # http://localhost:3004

VITE_APPWRITE_PROJECT_ID=your_project_idnpm run dev:landing  # http://localhost:3000

VITE_APPWRITE_DATABASE_ID=your_database_id```



# Required for authentication## 📱 What You'll See

VITE_APPWRITE_FUNCTION_MAGIC_LINK=your_magic_link_function_id

VITE_JWT_SECRET=$(openssl rand -base64 32)### Without AppWrite (Development Mode)

- **Player**: Shows "Authentication required" or "Loading..."

# Required for player/request handling- **Auth**: Login form (magic link send will fail gracefully)

VITE_APPWRITE_FUNCTION_PLAYER_REGISTRY=your_player_registry_id- **Admin**: Requires authentication

VITE_APPWRITE_FUNCTION_PROCESS_REQUEST=your_process_request_id- **Landing**: Works without AppWrite ✅



# Optional: YouTube search### With AppWrite Configured

VITE_YOUTUBE_API_KEY=your_youtube_api_key- Full functionality enabled

```- Real-time synchronization

- Master player registration

---- Queue management



## 3. Start Development Server (1 minute)## 🔧 Set Up AppWrite (Required for Full Functionality)



### Option A: Start All Apps (Recommended)### Option 1: AppWrite Cloud (Easiest)

1. Go to https://cloud.appwrite.io

```bash2. Create a new project

npm run dev3. Copy project ID and API key

```4. Run: `npm run create-collections`



This starts all applications:### Option 2: Self-Hosted

- **Landing**: http://localhost:51731. Install AppWrite: `docker run -d --name appwrite ...`

- **Auth**: http://localhost:51742. Access console at http://localhost

- **Dashboard**: http://localhost:51753. Create project and database

- **Player**: http://localhost:51764. Run: `npm run create-collections`

- **Admin**: http://localhost:5177

- **Kiosk**: http://localhost:5178## 🧪 Run Tests



### Option B: Start Individual Apps```bash

# Unit tests (no AppWrite needed)

```bashnpm run test:unit

# Player (main venue display)

npm run dev:player# E2E tests (requires dev server running)

npm run test:e2e

# Dashboard (user management)```

npm run dev:dashboard

## 📚 Next Steps

# Admin (venue queue control)

npm run dev:admin1. **Read README.md** for complete documentation

2. **Configure AppWrite** for full functionality  

# Kiosk (song request interface)3. **Deploy Functions** for backend features

npm run dev:kiosk4. **Set up GitHub secrets** for CI/CD



# Auth (magic link login)## 💡 Pro Tips

npm run dev:auth

- Use `npm run schema:check` to verify database schema

# Landing (public homepage)- Check `SETUP_COMPLETE.md` for architecture overview

npm run dev:landing- All TypeScript errors will resolve after first build

```- LocalStorage keys are documented in README.md



---## 🆘 Troubleshooting



## 4. Test the Application**Q: I see TypeScript errors**  

A: Normal! Run `npm run dev:player` and they'll resolve.

### Without AppWrite Setup (Development Mode)

**Q: Player shows "Authentication required"**  

**Landing Page** ✅A: Configure `.env` with AppWrite credentials.

```

http://localhost:5173**Q: Tests fail**  

→ Shows homepage (no backend required)A: Unit tests should pass. E2E tests need dev server running.

```

**Q: Can't find modules**  

**Player** (Partial)A: Restart your editor to load new TypeScript paths.

```

http://localhost:5176/player/venue-001## 🎉 You're Ready!

→ Shows "Connecting to venue..." or login prompt

```The project is fully set up and ready for development. Start with the player app and explore from there!



### With AppWrite Setup**Happy coding! 🚀**


**Test Authentication:**
```
1. Visit http://localhost:5174
2. Enter your email
3. Check inbox for magic link
4. Click link → redirects to dashboard
```

**Test Player:**
```
1. Visit http://localhost:5176/player/venue-001
2. Should show queue and now playing
3. Click play → YouTube video loads
```

---

## 5. What's Running?

| App | Port | Purpose | Needs Auth? |
|-----|------|---------|-------------|
| **Landing** | 5173 | Homepage | No |
| **Auth** | 5174 | Login/Signup | No |
| **Dashboard** | 5175 | User venues | Yes |
| **Player** | 5176 | Music player | Venue-based |
| **Admin** | 5177 | Queue control | Yes |
| **Kiosk** | 5178 | Song requests | Venue-based |

---

## 🔧 Troubleshooting

### "Cannot connect to AppWrite"

**Problem:** Missing or incorrect AppWrite credentials

**Solution:**
```bash
# Verify .env file exists
ls -la .env

# Check values are set (not empty)
grep VITE_APPWRITE .env

# Restart dev server
npm run dev
```

### "Magic link not working"

**Problem:** Magic link function not deployed or misconfigured

**Solution:**
1. Check function ID in `.env` matches AppWrite console
2. Verify function has environment variables set
3. See [DEPLOYMENT.md](./DEPLOYMENT.md#appwrite-functions) for setup

### "YouTube videos not loading"

**Problem:** Missing YouTube API key or CORS issues

**Solution:**
```bash
# Add YouTube API key to .env
VITE_YOUTUBE_API_KEY=your_key_here

# Restart dev server
npm run dev:player
```

### Build Errors

**Problem:** Outdated dependencies or missing packages

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf apps/*/dist apps/*/.vite
```

---

## 📚 Next Steps

- **[Configuration Guide](./CONFIGURATION.md)** - Detailed environment setup
- **[Deployment Guide](./DEPLOYMENT.md)** - Deploy to production
- **[Architecture Docs](../architecture/ARCHITECTURE.md)** - System design
- **[API Reference](../reference/API_REFERENCE.md)** - Endpoint documentation

---

## 🆘 Need Help?

- **GitHub Issues:** https://github.com/SystemVirtue/djamms-50-pg/issues
- **Documentation:** See [DOCUMENTATION_MAP.md](../../DOCUMENTATION_MAP.md)
- **Production URLs:** See [PRODUCTION_APP_LINKS.md](../../PRODUCTION_APP_LINKS.md)

---

**Last Updated:** October 16, 2025  
**Status:** Production Ready ✅
