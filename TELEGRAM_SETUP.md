# 🤖 Telegram Mini App Setup Guide

Complete guide to deploying OpenRemit as a Telegram Mini App.

## Prerequisites

- Telegram account
- Node.js 18+ installed
- Python 3.9+ installed
- Vercel/Netlify account (for frontend hosting)
- Railway/Render account (for backend hosting)

---

## Part 1: Create Telegram Bot

### Step 1: Talk to BotFather

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/start` to begin
3. Send `/newbot` to create a new bot
4. Choose a display name: **OpenRemit** (or your choice)
5. Choose a username: **openremit_bot** (must end in "bot")

**BotFather will respond with:**
```
Done! Congratulations on your new bot. You will find it at t.me/openremit_bot
Use this token to access the HTTP API:
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

⚠️ **SAVE THIS TOKEN** - You'll need it later!

### Step 2: Configure Bot Settings

Send these commands to BotFather:

```
/setdescription
[Select your bot]
Compare bridge routes and save money on USDC transfers. Powered by Li.Fi API.

/setabouttext
[Select your bot]
OpenRemit - Find the cheapest USDC bridge routes across Ethereum, Base, Arbitrum, and Optimism.

/setuserpic
[Upload a logo image - 512x512px recommended]
```

---

## Part 2: Deploy Frontend

### Option A: Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   cd /Users/aradhya/Desktop/AI\ projects/openremit-pro
   git init
   git add .
   git commit -m "Initial commit - Phase 2 complete"
   gh repo create openremit-pro --public --source=. --push
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repo
   - Configure:
     - Framework: Vite
     - Build Command: `npm run build`
     - Output Directory: `dist`
   - Add Environment Variable:
     - `VITE_API_URL` = Your backend URL (from Part 3)
   - Click "Deploy"

3. **Get Deployment URL**
   - Vercel will give you: `https://openremit-pro.vercel.app`
   - ⚠️ **SAVE THIS URL** - needed for Telegram setup!

### Option B: Netlify

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

---

## Part 3: Deploy Backend

### Option A: Railway

1. Go to [railway.app](https://railway.app)
2. Create new project → "Deploy from GitHub"
3. Select your repo
4. Configure:
   - Start Command: `python api_server.py`
   - Add environment variables (if needed)
5. Deploy
6. Get deployment URL: `https://openremit-api.up.railway.app`

### Option B: Render

1. Go to [render.com](https://render.com)
2. New Web Service → Connect GitHub repo
3. Configure:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python api_server.py`
4. Deploy

---

## Part 4: Create Mini App

### Step 1: Enable Web App

Send to BotFather:
```
/newapp
[Select your bot: @openremit_bot]

Title: OpenRemit
Description: Compare USDC bridge routes
Photo: [Upload 640x360px screenshot]
Demo GIF: [Optional - upload demo]

Web App URL: https://openremit-pro.vercel.app

Short name: openremit
```

**BotFather will respond:**
```
Done! Your Web App openremit is now available
```

### Step 2: Test the Mini App

1. Find your bot: [@openremit_bot](https://t.me/openremit_bot)
2. Click "Menu" button (bottom left)
3. Click "OpenRemit" to launch the Mini App
4. Should see the app loading in Telegram!

---

## Part 5: Configure App for Telegram

### Update Frontend Environment

Create `.env.production`:
```env
VITE_API_URL=https://openremit-api.up.railway.app
VITE_TELEGRAM_BOT_NAME=openremit_bot
```

### Update Backend CORS

Edit `api_server.py`:
```python
from flask_cors import CORS

# Allow Telegram Mini App origins
CORS(app, origins=[
    "https://openremit-pro.vercel.app",
    "https://web.telegram.org",
    "https://telegram.org"
])
```

Redeploy both frontend and backend after changes.

---

## Part 6: Testing

### Test in Telegram Desktop
1. Open Telegram Desktop
2. Search for your bot
3. Launch the Mini App
4. Test all features

### Test in Telegram Mobile
1. Open Telegram on phone (iOS or Android)
2. Search for your bot
3. Launch the Mini App
4. Test touch interactions

### Test Features:
- ✅ Amount input ($500)
- ✅ Network selection (Base, Arbitrum, Optimism)
- ✅ @username input (requires .ton domain)
- ✅ Wallet address input
- ✅ "Compare Bridge Routes" button
- ✅ Loading animation
- ✅ Route comparison screen
- ✅ Tab switching (Cheapest, Fastest, Popular)
- ✅ Fee breakdown expansion
- ✅ Back button navigation

---

## Part 7: Share Your Mini App

### Direct Link
```
https://t.me/openremit_bot/openremit
```

### Share Button (Add to Bot)
Send to BotFather:
```
/setinline
[Select your bot]
@openremit_bot
```

Now users can share with: `@openremit_bot` in any chat

---

## Troubleshooting

### Issue: "Unsafe scripts" error
**Fix:** Make sure your Vercel/Netlify deployment uses HTTPS (should be automatic)

### Issue: "Failed to load resource"
**Fix:** Check CORS settings in `api_server.py` - must allow Telegram origins

### Issue: App shows blank screen
**Fix:** Check browser console (right-click → Inspect in Telegram Desktop)
- Look for CORS errors
- Check API endpoint is accessible
- Verify environment variables

### Issue: @username resolution not working
**Fix:** TON DNS resolution requires:
- User must have registered .ton domain
- Domain must be linked to their wallet
- Test with known .ton domains first

### Issue: "This bot can't be added to groups"
**Fix:** This is a Mini App, not a group bot. Users interact 1-on-1.

---

## Production Checklist

Before launching to users:

- [ ] Frontend deployed to production (Vercel/Netlify)
- [ ] Backend deployed to production (Railway/Render)
- [ ] Environment variables configured
- [ ] CORS settings updated
- [ ] Bot created with BotFather
- [ ] Mini App registered
- [ ] Tested on Telegram Desktop
- [ ] Tested on Telegram Mobile (iOS)
- [ ] Tested on Telegram Mobile (Android)
- [ ] @username resolution tested
- [ ] All routes tested (Base, Arbitrum, Optimism)
- [ ] Error handling verified
- [ ] Analytics configured (optional)

---

## Next Steps

1. **Analytics**: Add PostHog or Mixpanel to track usage
2. **Wallet Integration**: Add TON Connect for wallet linking
3. **Notifications**: Add bot commands to notify users of rate drops
4. **Referrals**: Add referral system with /start parameters
5. **Premium Features**: Add fee discounts for premium users

---

## Resources

- [Telegram Mini Apps Docs](https://core.telegram.org/bots/webapps)
- [BotFather Guide](https://core.telegram.org/bots#botfather)
- [@tma.js Documentation](https://docs.telegram-mini-apps.com)
- [TON DNS Guide](https://docs.ton.org/v3/guidelines/web3/ton-dns/dns)
- [Li.Fi API Docs](https://docs.li.fi)

---

## Support

Need help? Open an issue or reach out:
- GitHub Issues: [Your repo link]
- Telegram Community: [Your community link]

---

**Built with:**
- React + TypeScript + Vite
- Telegram Mini Apps SDK (@tma.js)
- Li.Fi Bridge Aggregator API
- Circle CCTP estimation
- TON Blockchain for username resolution

**Happy Building! 🚀**
