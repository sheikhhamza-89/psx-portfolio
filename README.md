# PSXFolio — Pakistan Stock Exchange Portfolio Tracker

A simple, elegant web app to track your PSX (Pakistan Stock Exchange) investments.

![PSXFolio Screenshot](https://img.shields.io/badge/Status-Ready%20to%20Deploy-brightgreen)

## Features

- ✅ **Add/Edit/Delete stocks** — Track symbol, shares, and purchase price
- 📊 **Portfolio overview** — See investment, current value, and P&L at a glance
- 💾 **LocalStorage** — Data persists in your browser
- 🔄 **Price fetching** — Attempts to fetch current prices (with manual fallback)
- 📱 **Responsive** — Works on desktop, tablet, and mobile
- 🎨 **Trading terminal aesthetic** — Professional dark theme

## Quick Start

### Option 1: Open Directly
Simply open `index.html` in your browser.

### Option 2: Local Server
```bash
npx serve
```

## Deploy to Netlify

### Via Drag & Drop
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag the entire project folder

### Via Netlify CLI
```bash
npx netlify-cli deploy --prod
```

### Via GitHub Integration
1. Push this repo to GitHub
2. Connect your GitHub repo to Netlify
3. Deploy automatically on every push

## Project Structure

```
psx-portfolio/
├── index.html    # Main HTML structure
├── style.css     # Styling (dark theme)
├── script.js     # Application logic
├── .gitignore    # Git ignore rules
└── README.md     # This file
```

## Usage

1. **Add a stock**: Enter symbol (e.g., OGDC, HBL, PSO), number of shares, and purchase price
2. **View portfolio**: See all your holdings with real-time P&L calculations
3. **Edit/Delete**: Use the action buttons in the table to modify entries
4. **Refresh prices**: Click "Refresh Prices" to fetch latest prices

## Note on Price Data

PSX doesn't provide a free public API. The app attempts to fetch prices from Yahoo Finance (using `.KA` suffix for Karachi exchange). If unavailable, enter current prices manually.

## Tech Stack

- Pure HTML, CSS, JavaScript
- No build tools required
- No external dependencies
- LocalStorage for data persistence

## License

MIT — Feel free to use and modify.

