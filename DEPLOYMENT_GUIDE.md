# Incentive Vault - Deployment Guide

Welcome! This guide walks you through deploying Incentive Vault to production. **Don't worry—it's simpler than it looks.**

---

## **STEP 1: Set Up Your Development Environment**

### Prerequisites
- GitHub account (free at github.com)
- Firebase account (free at firebase.google.com)
- Vercel account (free at vercel.com)

### Install Node.js
Download from nodejs.org (v16 or higher). This gives you npm, which you'll need.

**Test installation:**
```bash
node --version
npm --version
```

---

## **STEP 2: Set Up Firebase**

Firebase handles your database, storage, and authentication.

### Create a Firebase Project

1. Go to [firebase.google.com](https://firebase.google.com)
2. Click "Get Started" → "Create a project"
3. Name it "Incentive Vault"
4. Select "Create project"

### Enable Authentication

1. In Firebase console, click "Authentication" (left sidebar)
2. Click "Get Started"
3. Enable "Email/Password" sign-in method

### Enable Firestore Database

1. Click "Firestore Database" (left sidebar)
2. Click "Create database"
3. Select "Start in production mode"
4. Choose region closest to you (e.g., "us-central1")

### Get Your Firebase Keys

1. Click Settings icon (top left) → "Project settings"
2. Scroll to "Your apps" section
3. Click the "</>" (web) icon
4. Copy the config object

**It looks like this:**
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefg123456"
};
```

---

## **STEP 3: Create .env File**

1. In your project folder, create a file named `.env.local` (note: NOT `.env.example`)
2. Copy the contents from `.env.example`
3. Replace each placeholder with your actual Firebase keys:

```
REACT_APP_FIREBASE_API_KEY=YOUR_API_KEY_HERE
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdefg123456
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_your_key_here
```

**Important:** Never commit `.env.local` to GitHub. It's already in `.gitignore`.

---

## **STEP 4: Push Code to GitHub**

### Create GitHub Repo

1. Go to [github.com](https://github.com)
2. Click "+" → "New repository"
3. Name it "incentive-vault"
4. Choose "Public" (so Vercel can access it)
5. Click "Create repository"

### Push Your Code

Open terminal in your project folder:

```bash
git init
git add .
git commit -m "Initial commit: Incentive Vault app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/incentive-vault.git
git push -u origin main
```

(Replace `YOUR_USERNAME` with your GitHub username)

---

## **STEP 5: Deploy to Vercel**

### Connect Vercel to GitHub

1. Go to [vercel.com](https://vercel.com)
2. Click "Login" or "Sign Up"
3. Select "Continue with GitHub"
4. Authorize Vercel

### Create New Project

1. In Vercel dashboard, click "New Project"
2. Search for "incentive-vault" repo
3. Click "Import"

### Add Environment Variables

1. Scroll to "Environment Variables"
2. Add all variables from your `.env.local` file:
   - `REACT_APP_FIREBASE_API_KEY`
   - `REACT_APP_FIREBASE_AUTH_DOMAIN`
   - `REACT_APP_FIREBASE_PROJECT_ID`
   - `REACT_APP_FIREBASE_STORAGE_BUCKET`
   - `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
   - `REACT_APP_FIREBASE_APP_ID`
   - `REACT_APP_STRIPE_PUBLIC_KEY`

### Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for build to complete
3. You'll get a temporary URL like `incentive-vault-abc123.vercel.app`

**Test it:** Visit the URL and try to sign up!

---

## **STEP 6: Point Your Domain to Vercel**

You've bought `theincentivevault.com` from GoDaddy. Now connect it.

### In Vercel

1. In your project settings, click "Domains"
2. Click "Add Domain"
3. Enter `theincentivevault.com`
4. Vercel gives you DNS records to add

### In GoDaddy

1. Log in to GoDaddy
2. Find "DNS Management"
3. Copy Vercel's DNS records into GoDaddy
4. Save changes

**Wait 24 hours** for DNS to propagate. Then visit `theincentivevault.com`—it should work!

---

## **STEP 7: Local Development (Optional)**

Want to test locally before deploying?

```bash
# Install dependencies
npm install

# Start development server
npm start

# App opens at http://localhost:3000
```

---

## **STEP 8: Firestore Firewall Rules**

Firebase defaults to "production mode" (secure). You need to allow writes from your users:

1. In Firebase console, click "Firestore Database"
2. Click "Rules" tab
3. Replace with this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

This allows authenticated users to read/write their data.

---

## **STEP 9: Firebase Storage Rules**

Similarly, allow users to upload photos:

1. In Firebase console, click "Storage"
2. Click "Rules" tab
3. Replace with this:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## **STEP 10: Set Up Stripe (Payment Processing)**

Later when you're ready for payments:

1. Create Stripe account at [stripe.com](https://stripe.com)
2. Get your public key from dashboard
3. Add to `.env.local`: `REACT_APP_STRIPE_PUBLIC_KEY=pk_test_...`
4. Redeploy to Vercel

For now, leave it blank or use test key.

---

## **Annual Maintenance Checklist**

Every November (before barrel racing season):

- [ ] Contact all 5 programs for fee/deadline updates
- [ ] Update program data in admin panel
- [ ] Check Firebase usage (make sure you're within free tier)
- [ ] Update enrollment lists for stallions per program
- [ ] Test email reminders work correctly

---

## **Troubleshooting**

### "Build failed on Vercel"
- Check that `.env.local` has all Firebase keys
- Make sure `package.json` exists in root folder
- Look at Vercel build logs for specific error

### "Firebase not initializing"
- Double-check `REACT_APP_FIREBASE_` variables in Vercel env settings
- They must match exactly what Firebase gives you

### "Domain not working after 24 hours"
- Check GoDaddy DNS records match Vercel's exactly
- Wait another 24 hours (DNS can take longer)
- Clear browser cache and try incognito mode

### "Users can't upload photos"
- Check Firebase Storage rules are correct
- Make sure user is authenticated before uploading

---

## **Support**

If you get stuck:
1. Check Vercel build logs
2. Check Firebase console for errors
3. Google the error message
4. Ask in relevant forums (Vercel, Firebase communities)

---

## **Next Steps**

Once live:
1. Invite beta users (barrel horse owners)
2. Gather feedback
3. Iterate on features
4. Add Stripe when ready for paid tiers
5. Scale to other disciplines (cutters, ropers, reiners)

**You've got this! 🏇**
