# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Verify Installation ✅

Dependencies are already installed! You should see `node_modules/` directory.

### 2. Configure Environment (2 minutes)

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your editor and add:
# - VITE_APPWRITE_ENDPOINT (your AppWrite URL)
# - VITE_APPWRITE_PROJECT_ID (from AppWrite console)
# - VITE_APPWRITE_DATABASE_ID (e.g., "djamms_production")
# - VITE_JWT_SECRET (generate with: openssl rand -base64 32)
```

### 3. Start Development (1 minute)

```bash
# Start the player app (main component)
npm run dev:player
```

Open http://localhost:3001/player/venue1 in your browser.

**Note**: You'll see the PlayerBusyScreen until AppWrite is configured. This is expected!

### 4. Start Other Apps (Optional)

```bash
# In separate terminals:
npm run dev:auth     # http://localhost:3002
npm run dev:admin    # http://localhost:3003
npm run dev:kiosk    # http://localhost:3004
npm run dev:landing  # http://localhost:3000
```

## 📱 What You'll See

### Without AppWrite (Development Mode)
- **Player**: Shows "Authentication required" or "Loading..."
- **Auth**: Login form (magic link send will fail gracefully)
- **Admin**: Requires authentication
- **Landing**: Works without AppWrite ✅

### With AppWrite Configured
- Full functionality enabled
- Real-time synchronization
- Master player registration
- Queue management

## 🔧 Set Up AppWrite (Required for Full Functionality)

### Option 1: AppWrite Cloud (Easiest)
1. Go to https://cloud.appwrite.io
2. Create a new project
3. Copy project ID and API key
4. Run: `npm run create-collections`

### Option 2: Self-Hosted
1. Install AppWrite: `docker run -d --name appwrite ...`
2. Access console at http://localhost
3. Create project and database
4. Run: `npm run create-collections`

## 🧪 Run Tests

```bash
# Unit tests (no AppWrite needed)
npm run test:unit

# E2E tests (requires dev server running)
npm run test:e2e
```

## 📚 Next Steps

1. **Read README.md** for complete documentation
2. **Configure AppWrite** for full functionality  
3. **Deploy Functions** for backend features
4. **Set up GitHub secrets** for CI/CD

## 💡 Pro Tips

- Use `npm run schema:check` to verify database schema
- Check `SETUP_COMPLETE.md` for architecture overview
- All TypeScript errors will resolve after first build
- LocalStorage keys are documented in README.md

## 🆘 Troubleshooting

**Q: I see TypeScript errors**  
A: Normal! Run `npm run dev:player` and they'll resolve.

**Q: Player shows "Authentication required"**  
A: Configure `.env` with AppWrite credentials.

**Q: Tests fail**  
A: Unit tests should pass. E2E tests need dev server running.

**Q: Can't find modules**  
A: Restart your editor to load new TypeScript paths.

## 🎉 You're Ready!

The project is fully set up and ready for development. Start with the player app and explore from there!

**Happy coding! 🚀**
