# Vercel CLI Directory Configuration

## Question: "In which directory is your code located?"

### ✅ Correct Answer: `./` (current directory)

When Vercel CLI asks "In which directory is your code located?", you should answer:

```
./
```

Or just press **Enter** to accept the default `./`

---

## 🔍 Explanation

**Why `./` and not something else?**

When you run `vercel` from your project root (`/Users/mikeclarkin/DJAMMS_50_page_prompt`), Vercel is asking where your source code is **relative to the current directory**.

Since:
1. Your `vercel.json` is in the project root
2. Your build commands run from the root (`npm run build:landing`, etc.)
3. Your `node_modules` are in the root
4. Your `package.json` is in the root

The answer is **current directory** = `./`

---

## 🎯 What Vercel Does With This

After you answer `./`, Vercel:
1. Looks for `vercel.json` in `./vercel.json`
2. Runs `npm install` in `./`
3. Runs your build command from `./`
4. Reads the output directory path from `./` (e.g., `apps/landing/dist`)

---

## ⚠️ Common Mistakes

### ❌ DON'T Answer:
- `apps/landing` - This is wrong, it would look for package.json there
- `/Users/mikeclarkin/DJAMMS_50_page_prompt` - Absolute paths aren't needed
- `landing` - There's no such directory at root
- (blank) - You can leave it blank, which defaults to `./`

### ✅ DO Answer:
- `./` - Current directory (recommended)
- `.` - Also works (same as `./`)
- (press Enter) - Accepts default `./`

---

## 📋 Full Vercel CLI Prompt Answers

When deploying from project root, here's what to answer:

```bash
? Set up and deploy "~/DJAMMS_50_page_prompt"? [Y/n]
👉 y (or just press Enter)

? Which scope do you want to deploy to?
👉 djamms-admins-projects (or your team/personal scope)

? Link to existing project? [y/N]
👉 y (if project already exists in Vercel dashboard)
   n (if creating new project)

? What's your project's name?
👉 djamms-landing (or djamms-auth, djamms-player, etc.)

? In which directory is your code located?
👉 ./ (or just press Enter)
```

---

## 🚀 Context: Monorepo Structure

Your project structure:
```
/Users/mikeclarkin/DJAMMS_50_page_prompt/    ← You run vercel here
├── vercel.json                               ← Vercel finds config here
├── package.json                              ← Vercel runs npm install here
├── node_modules/                             ← Dependencies here
├── apps/
│   ├── landing/
│   │   ├── src/
│   │   └── dist/                             ← Build outputs here
│   ├── auth/
│   ├── player/
│   └── ...
```

When you answer `./`:
- Working directory: `/Users/mikeclarkin/DJAMMS_50_page_prompt`
- Config file: `./vercel.json`
- Build command runs from: `./`
- Output directory: `apps/landing/dist` (relative to `./`)

---

## 🔧 If You're in a Subdirectory

**Scenario:** You `cd apps/landing` first, then run `vercel`

```bash
cd apps/landing
vercel
```

**Answer:** Still `./` (current directory)

But this is **NOT recommended** because:
- No `vercel.json` in `apps/landing/`
- No root `package.json` for installing all dependencies
- Build commands won't work correctly

**Always run `vercel` from project root!**

---

## ✅ Summary

**Question:** "In which directory is your code located?"

**Answer:** `./` (current directory)

**Or:** Just press Enter to accept the default

**Why:** Your `vercel.json`, `package.json`, and build commands are configured for the root directory

---

## 🎯 Quick Reference

| Prompt | Answer |
|--------|--------|
| Directory is your code located? | `./` or press Enter |
| Set up and deploy? | `y` or press Enter |
| Which scope? | `djamms-admins-projects` |
| Link to existing? | `y` (if exists) or `n` (new) |
| Project name? | `djamms-[app-name]` |

Done! 🚀
