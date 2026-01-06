# PSXFolio — Pakistan Stock Exchange Portfolio Tracker

A modern, beautiful portfolio tracker for Pakistan Stock Exchange (PSX) stocks built with React.

![PSXFolio](https://img.shields.io/badge/PSX-Portfolio-00e5a0?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite)

## Features

- 📊 **Real-time Price Fetching** - Fetches live prices from PSX
- 💰 **Portfolio Tracking** - Track your investments, current value, and P&L
- 📈 **Interactive Charts** - Visualize your portfolio with:
  - Allocation donut chart
  - P&L bar chart
  - Investment vs Current value area chart
- 💾 **Local Storage** - Your data persists in your browser
- 🎨 **Trading Terminal Aesthetic** - Beautiful dark theme with terminal vibes
- 📱 **Responsive Design** - Works on desktop and mobile

## Tech Stack

- **React 19** - Modern React with hooks
- **Vite** - Lightning fast build tool
- **Recharts** - Beautiful, composable charts
- **CSS Variables** - Theming and customization

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/sheikhhamza-89/psx-portfolio.git

# Navigate to project
cd psx-portfolio

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
```

## Project Structure

```
psx-portfolio/
├── src/
│   ├── components/       # React UI components
│   │   ├── charts/       # Chart components (Recharts)
│   │   ├── Header.jsx
│   │   ├── StockForm.jsx
│   │   ├── PortfolioTable.jsx
│   │   └── ...
│   ├── hooks/            # Custom React hooks
│   │   ├── usePortfolio.js
│   │   ├── usePriceCache.js
│   │   └── ...
│   ├── services/         # API services
│   │   └── priceService.js
│   ├── utils/            # Utilities & constants
│   ├── App.jsx
│   └── index.css
├── netlify.toml          # Netlify deployment config
└── package.json
```

## Deployment

This project is configured for Netlify deployment. Simply connect your GitHub repository to Netlify and it will automatically build and deploy.

## License

MIT License

---

Made with ❤️ for Pakistani investors

