# MAG7 Tracker

A mobile-optimized stock tracker for the Magnificent 7 stocks. Auto-refreshes every hour.

## Stocks Tracked
AAPL · MSFT · GOOGL · AMZN · META · NVDA · TSLA

## Deploy to Vercel (Step-by-Step)

### Step 1: Upload this code to GitHub
1. Go to github.com and click the **"+"** icon → **"New repository"**
2. Name it `mag7-tracker`
3. Keep it **Public**, click **"Create repository"**
4. On the next page, click **"uploading an existing file"**
5. Upload ALL files from this folder (drag and drop the whole folder)
6. Click **"Commit changes"**

### Step 2: Deploy on Vercel
1. Go to **vercel.com** and click **"Add New Project"**
2. Click **"Import"** next to your `mag7-tracker` GitHub repo
3. On the configure screen, click **"Environment Variables"**
4. Add this variable:
   - **Name:** `REACT_APP_FINNHUB_API_KEY`
   - **Value:** your Finnhub API key
5. Click **"Deploy"**
6. Wait ~2 minutes — Vercel gives you a live URL!

### Step 3: Add to your phone home screen
**iPhone:** Open the URL in Safari → Share button → "Add to Home Screen"
**Android:** Open in Chrome → 3-dot menu → "Add to Home Screen"

## Local Development
```
npm install
echo "REACT_APP_FINNHUB_API_KEY=your_key_here" > .env
npm start
```
