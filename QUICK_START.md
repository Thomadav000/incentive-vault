# Incentive Vault - Quick Start Checklist

Follow this checklist to get Incentive Vault live in the next 2 hours.

---

## **Before You Start**
- [ ] You have access to your email
- [ ] You own theincentivevault.com (purchased from GoDaddy)
- [ ] You have internet connection
- [ ] You have 2-3 hours to complete this

---

## **PHASE 1: Setup (30 minutes)**

### Create GitHub Account
- [ ] Go to github.com
- [ ] Click "Sign Up"
- [ ] Create account with your email (da.thomas2301@gmail.com)
- [ ] Verify email

### Create Firebase Project
- [ ] Go to firebase.google.com
- [ ] Click "Get Started"
- [ ] Create project named "Incentive Vault"
- [ ] Wait for project to create
- [ ] Copy your Firebase config (Settings → Project Settings → Web app config)
- [ ] Save config in notepad (you'll need it soon)

### Create Vercel Account
- [ ] Go to vercel.com
- [ ] Click "Sign Up"
- [ ] Select "Continue with GitHub"
- [ ] Authorize Vercel

---

## **PHASE 2: Local Setup (20 minutes)**

### Install Node.js
- [ ] Download nodejs.org (LTS version)
- [ ] Install (follow wizard, use default settings)
- [ ] Open terminal/command prompt
- [ ] Type: `node --version` (should show version #)

### Download Project Code
- [ ] Download the `incentive-vault-complete` folder
- [ ] Extract to your computer (e.g., `C:\Users\David\incentive-vault-complete`)

### Create Environment File
- [ ] Open `.env.example` in the project folder
- [ ] Create new file called `.env.local` (copy of `.env.example`)
- [ ] Fill in your Firebase keys (from Step 2 above)
- [ ] Save `.env.local` file

**Example:**
```
REACT_APP_FIREBASE_API_KEY=YOUR_API_KEY_HERE
REACT_APP_FIREBASE_AUTH_DOMAIN=incentive-vault-abc123.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=incentive-vault-abc123
REACT_APP_FIREBASE_STORAGE_BUCKET=incentive-vault-abc123.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc123def456
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_your_key_here
```

---

## **PHASE 3: Deploy to GitHub (15 minutes)**

### Open Terminal
- [ ] Open Command Prompt or Terminal
- [ ] Navigate to project folder: `cd C:\Users\David\incentive-vault-complete`

### Push to GitHub
- [ ] Type these commands one by one:

```bash
git init
git add .
git commit -m "Initial commit: Incentive Vault"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/incentive-vault.git
git push -u origin main
```

(Replace `YOUR_USERNAME` with your GitHub username)

- [ ] Go to github.com, confirm code is there in "incentive-vault" repo

---

## **PHASE 4: Deploy to Vercel (20 minutes)**

### Connect to Vercel
- [ ] Go to vercel.com dashboard
- [ ] Click "New Project"
- [ ] Search for "incentive-vault" repo
- [ ] Click "Import"

### Add Environment Variables
- [ ] Under "Environment Variables", add each variable:
  - [ ] REACT_APP_FIREBASE_API_KEY
  - [ ] REACT_APP_FIREBASE_AUTH_DOMAIN
  - [ ] REACT_APP_FIREBASE_PROJECT_ID
  - [ ] REACT_APP_FIREBASE_STORAGE_BUCKET
  - [ ] REACT_APP_FIREBASE_MESSAGING_SENDER_ID
  - [ ] REACT_APP_FIREBASE_APP_ID
  - [ ] REACT_APP_STRIPE_PUBLIC_KEY

### Deploy
- [ ] Click "Deploy"
- [ ] Wait 2-3 minutes for build to complete
- [ ] You'll get a URL like `incentive-vault-abc123.vercel.app`
- [ ] [ ] Click the link and test the app (try signing up!)

---

## **PHASE 5: Setup Firebase (15 minutes)**

### Enable Authentication
- [ ] Go to firebase.google.com → your project
- [ ] Click "Authentication" (left sidebar)
- [ ] Click "Get Started"
- [ ] Enable "Email/Password"

### Enable Firestore Database
- [ ] Click "Firestore Database" (left sidebar)
- [ ] Click "Create database"
- [ ] Start in "Production mode"
- [ ] Choose closest region

### Update Firestore Rules
- [ ] Click "Firestore Database"
- [ ] Click "Rules" tab
- [ ] Replace with:
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
- [ ] Click "Publish"

### Update Storage Rules
- [ ] Click "Storage" (left sidebar)
- [ ] Click "Rules" tab
- [ ] Replace with:
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
- [ ] Click "Publish"

---

## **PHASE 6: Connect Domain (10 minutes)**

### In Vercel
- [ ] Go to your Vercel project
- [ ] Click "Settings" → "Domains"
- [ ] Click "Add Domain"
- [ ] Type: `theincentivevault.com`
- [ ] Vercel shows DNS records

### In GoDaddy
- [ ] Log in to godaddy.com
- [ ] Find "DNS Management"
- [ ] Copy Vercel's DNS records
- [ ] Paste into GoDaddy
- [ ] Save changes

### Wait for DNS
- [ ] **WAIT 24 hours** for DNS to propagate
- [ ] After 24 hours: Visit theincentivevault.com
- [ ] Should show your app!

---

## **PHASE 7: Test Everything (10 minutes)**

### Test App Flow
- [ ] [ ] Visit theincentivevault.com (or vercel URL if domain not ready)
- [ ] [ ] Click "Sign Up"
- [ ] [ ] Create test account
- [ ] [ ] Add a test horse
- [ ] [ ] View dashboard
- [ ] [ ] Check calendar
- [ ] [ ] Visit admin panel
- [ ] [ ] Everything working? 🎉

---

## **NOW YOU'RE LIVE! 🏇**

**You've successfully deployed Incentive Vault!**

---

## **Next Steps (When Ready)**

- [ ] Invite beta users (barrel horse owners you know)
- [ ] Get feedback on features
- [ ] Set up Stripe for payments (Phase 2)
- [ ] Configure email reminders (Phase 2)
- [ ] Update program data in admin panel
- [ ] Plan expansion to other disciplines

---

## **Troubleshooting**

**If deploy fails:**
- Check Vercel build logs (click "Deployments" → failed build)
- Make sure all 6 Firebase keys are in `.env.local`
- Delete `node_modules` folder and run `npm install` again

**If domain doesn't work after 24 hours:**
- Clear browser cache
- Check GoDaddy DNS records match Vercel's exactly
- Wait another 24 hours
- Contact Vercel support

**If signup/login not working:**
- Check Firebase Authentication is enabled
- Check Firestore rules allow authenticated users

**If app is slow:**
- First deploy is slow, subsequent loads are fast
- Check Firebase usage (probably fine for MVP)

---

## **Contact Info**

- **Email:** da.thomas2301@gmail.com
- **Domain:** theincentivevault.com
- **GitHub:** github.com/YOUR_USERNAME/incentive-vault
- **Vercel:** vercel.com/dashboard

---

**You've got this! 💪**

Questions? Check DEPLOYMENT_GUIDE.md for more details.
