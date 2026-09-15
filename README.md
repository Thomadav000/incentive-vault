# Incentive Vault

> Never miss a barrel horse incentive deadline again

Track all 5 major barrel racing incentive programs in one place. Monitor deadlines, payments, and race dates with smart email reminders.

---

## **Features**

✅ **Horse Management** - Add unlimited horses with photos and details
✅ **5 Major Programs** - Future Fortunes, Pink Buckle, Ruby Buckle, Breeders Challenge, Select Stallion Stakes
✅ **Calendar View** - Color-coded deadlines, payments, and race dates
✅ **Smart Reminders** - Email notifications 1 week, 3 days, and 1 day before deadlines
✅ **Payment Tracking** - Monitor which programs you've paid
✅ **Document Storage** - Upload registration papers, pedigrees, payment proofs
✅ **Admin Panel** - Manage programs, fees, deadlines (built-in, fully editable)
✅ **Mobile Responsive** - Works perfect on phone and desktop

---

## **Tech Stack**

- **Frontend:** React 18, React Router
- **Backend:** Firebase (Firestore + Auth + Storage)
- **Hosting:** Vercel
- **Payments:** Stripe (when ready)
- **Email:** Brevo (when ready)

---

## **Quick Start**

### Prerequisites
- Node.js v16+
- npm or yarn

### Installation

```bash
# Clone the repo (or download the zip)
git clone https://github.com/YOUR_USERNAME/incentive-vault.git
cd incentive-vault

# Install dependencies
npm install

# Create .env.local file (copy from .env.example)
# Add your Firebase keys

# Start development server
npm start

# Visit http://localhost:3000
```

### First Time Setup

1. **Create Firebase project** - [firebase.google.com](https://firebase.google.com)
2. **Get Firebase keys** - Follow DEPLOYMENT_GUIDE.md
3. **Create .env.local file** - Copy from `.env.example`, add your keys
4. **Create GitHub repo** - Follow DEPLOYMENT_GUIDE.md
5. **Deploy to Vercel** - Follow DEPLOYMENT_GUIDE.md
6. **Point domain** - Connect theincentivevault.com to Vercel

**Detailed instructions in [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**

---

## **Project Structure**

```
incentive-vault/
├── public/
│   └── index.html
├── src/
│   ├── pages/
│   │   ├── HomePage.js          # Landing page
│   │   ├── Login.js              # Login
│   │   ├── SignUp.js             # Sign up
│   │   ├── Dashboard.js          # Your Barn (horse list)
│   │   ├── AddHorse.js           # Add horse form
│   │   ├── HorseProfile.js       # Individual horse details
│   │   ├── CalendarView.js       # Calendar with deadlines
│   │   └── AdminPanel.js         # Admin/program management
│   ├── components/
│   │   ├── Navigation.js         # Top navigation bar
│   │   └── Navigation.css
│   ├── App.js                    # Main app component
│   ├── firebase.js               # Firebase config
│   ├── index.js                  # Entry point
│   └── index.css                 # Global styles
├── package.json
├── .env.example                  # Environment variables template
├── .gitignore
├── vercel.json                   # Vercel config
├── DEPLOYMENT_GUIDE.md           # Step-by-step deployment
└── README.md                     # This file
```

---

## **How It Works**

### For Users (Barn Owners)

1. **Sign Up** - Create account with email
2. **Add Horses** - Enter horse info, verify on AQHA
3. **Enroll Programs** - Select which programs to track
4. **Track Deadlines** - View all deadlines in calendar
5. **Get Reminders** - Receive email reminders for upcoming deadlines
6. **Track Payments** - Mark programs as paid

### For Admin (You, David)

1. **Manage Programs** - Update program fees, deadlines, race dates
2. **Upload Stallion Lists** - Add annually enrolled stallions
3. **Upload Media** - Program logos, backgrounds, videos
4. **View Analytics** - See user signups, active programs, etc.

---

## **Programs Tracked**

| Program | Fee | Deadline | Website |
|---------|-----|----------|---------|
| Future Fortunes | $175-$275 | Dec 31 | futurefortunesinc.com |
| Pink Buckle | $200 | Nov 15 | pinkbuckle.com |
| Ruby Buckle | $200 | Dec 1 | therubybuckle.com |
| Breeders Challenge | $250 | Dec 1 | breederschallenge.com |
| Select Stallion Stakes | $200 | 7 days before | selectstallionstakes.com |

---

## **Pricing Tiers**

### Free
- 2 horses
- View all programs
- Manual tracking
- Basic reminders

### Rider ($6.99/month or $59.99/year)
- Unlimited horses
- All 5 programs
- Smart reminders
- Calendar view
- Payment tracking
- Document upload

### Trainer ($19.99/month or $149.99/year)
- Everything in Rider
- Multi-user access
- Client management
- Advanced analytics
- Priority support

---

## **Development Notes**

### Adding a New Feature

1. Create component in `src/pages/` or `src/components/`
2. Import in `App.js`
3. Add route if it's a page
4. Style with `.css` file
5. Test locally with `npm start`
6. Commit to GitHub
7. Auto-deploys to Vercel

### Modifying Admin Panel

The admin panel is fully editable without coding. Users will be able to:
- Add/edit/delete programs
- Upload program logos and media
- Manage enrollment deadlines
- Upload stallion lists
- Update fees and race dates

---

## **Common Tasks**

### Update a Program's Deadline

1. Go to `/admin`
2. Click "Edit" on the program
3. Change deadline date
4. Click "Save"

### Upload Stallion Enrollment List

1. Go to `/admin`
2. Click program name
3. Upload CSV file with stallion list
4. System auto-checks sires when users add horses

### Send Emergency Announcement

Future: Add "Announcements" section in admin to notify all users.

### Check User Analytics

Future: Add "Analytics" tab in admin to see:
- Total users
- Active users this month
- Programs most enrolled
- Most enrolled horses

---

## **Troubleshooting**

### App won't start locally
```bash
rm -rf node_modules package-lock.json
npm install
npm start
```

### Firebase error
- Check `.env.local` has all 6 Firebase keys
- Make sure Firestore and Storage are enabled
- Check security rules allow authenticated users

### Vercel deploy failed
- Check build logs in Vercel dashboard
- Make sure environment variables are set
- Try redeploying with "Redeploy" button

### Domain not working
- Wait 24-48 hours for DNS propagation
- Check GoDaddy DNS records match Vercel's
- Try clearing browser cache

---

## **Future Enhancements**

- [ ] AQHA API integration (auto-fill pedigree)
- [ ] SMS reminders
- [ ] Trainer multi-user setup
- [ ] Advanced analytics dashboard
- [ ] Video backgrounds (like Breeders Challenge)
- [ ] Expand to cutters, ropers, reiners
- [ ] Mobile app (React Native)
- [ ] Social features (share accomplishments)
- [ ] Stallion recommendation engine

---

## **Support & Contact**

- David: da.thomas2301@gmail.com
- GitHub: [github.com/YOUR_USERNAME/incentive-vault](https://github.com/YOUR_USERNAME)
- Domain: theincentivevault.com

---

## **License**

This project is owned by David Thomas. All rights reserved.

---

**Built with ❤️ for barrel horse owners**
