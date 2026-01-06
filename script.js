/**
 * PSXFolio — Pakistan Stock Exchange Portfolio Tracker
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// Configuration & Constants
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'psx_portfolio';
const PRICE_CACHE_KEY = 'psx_price_cache';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes cache

// Common PSX stock symbols for validation hints
const COMMON_SYMBOLS = [
    'OGDC', 'PPL', 'PSO', 'HBL', 'UBL', 'MCB', 'NBP', 'BAHL', 'MEBL',
    'LUCK', 'DGKC', 'MLCF', 'PIOC', 'FCCL', 'KOHC',
    'ENGRO', 'EFERT', 'FFC', 'FFBL',
    'HUBC', 'KEL', 'KAPCO', 'NPL',
    'MTL', 'ISL', 'ASTL',
    'MARI', 'POL',
    'SYS', 'TRG', 'AVN',
    'SEARL', 'GLAXO', 'AGP',
    'NESTLE', 'UNITY', 'COLG',
    'ATRL', 'NRL', 'PRL', 'BYCO'
];

// ═══════════════════════════════════════════════════════════════════════════
// State Management
// ═══════════════════════════════════════════════════════════════════════════

let portfolio = [];
let priceCache = {};
let isEditing = false;
let editIndex = -1;

// ═══════════════════════════════════════════════════════════════════════════
// DOM Elements
// ═══════════════════════════════════════════════════════════════════════════

const stockForm = document.getElementById('stock-form');
const symbolInput = document.getElementById('symbol');
const sharesInput = document.getElementById('shares');
const purchasePriceInput = document.getElementById('purchase-price');
const currentPriceInput = document.getElementById('current-price');
const editIndexInput = document.getElementById('edit-index');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const formTitle = document.getElementById('form-title');
const refreshBtn = document.getElementById('refresh-btn');
const portfolioBody = document.getElementById('portfolio-body');
const emptyState = document.getElementById('empty-state');
const portfolioTable = document.getElementById('portfolio-table');
const toast = document.getElementById('toast');

// Stats elements
const totalInvestmentEl = document.getElementById('total-investment');
const currentValueEl = document.getElementById('current-value');
const totalPnlEl = document.getElementById('total-pnl');

// ═══════════════════════════════════════════════════════════════════════════
// LocalStorage Functions
// ═══════════════════════════════════════════════════════════════════════════

function savePortfolio() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
    } catch (error) {
        console.error('Error saving portfolio:', error);
        showToast('Failed to save portfolio', 'error');
    }
}

function loadPortfolio() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        portfolio = data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error loading portfolio:', error);
        portfolio = [];
    }
}

function savePriceCache() {
    try {
        localStorage.setItem(PRICE_CACHE_KEY, JSON.stringify(priceCache));
    } catch (error) {
        console.error('Error saving price cache:', error);
    }
}

function loadPriceCache() {
    try {
        const data = localStorage.getItem(PRICE_CACHE_KEY);
        priceCache = data ? JSON.parse(data) : {};
        
        // Clean expired cache entries
        const now = Date.now();
        Object.keys(priceCache).forEach(symbol => {
            if (now - priceCache[symbol].timestamp > CACHE_DURATION) {
                delete priceCache[symbol];
            }
        });
    } catch (error) {
        console.error('Error loading price cache:', error);
        priceCache = {};
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Price Fetching
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetches stock price from available sources
 * Since PSX doesn't have a public free API, we try multiple approaches:
 * 1. Check cache first
 * 2. Try free APIs that might have PSX data
 * 3. Fall back to manual entry if all else fails
 */
async function fetchStockPrice(symbol) {
    const normalizedSymbol = symbol.toUpperCase().trim();
    
    // Check cache first
    if (priceCache[normalizedSymbol] && 
        Date.now() - priceCache[normalizedSymbol].timestamp < CACHE_DURATION) {
        return priceCache[normalizedSymbol].price;
    }
    
    // Try different API sources
    const price = await tryFetchFromAPIs(normalizedSymbol);
    
    if (price !== null) {
        // Cache the price
        priceCache[normalizedSymbol] = {
            price: price,
            timestamp: Date.now()
        };
        savePriceCache();
        return price;
    }
    
    return null;
}

async function tryFetchFromAPIs(symbol) {
    // List of potential API endpoints to try
    // Note: Most free APIs don't support PSX, so we provide graceful fallback
    
    const apis = [
        // Try Yahoo Finance (sometimes has KA for Karachi)
        {
            url: `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.KA`,
            parser: (data) => {
                if (data.chart?.result?.[0]?.meta?.regularMarketPrice) {
                    return data.chart.result[0].meta.regularMarketPrice;
                }
                return null;
            }
        }
    ];
    
    for (const api of apis) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(api.url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                const price = api.parser(data);
                if (price !== null && price > 0) {
                    return price;
                }
            }
        } catch (error) {
            // API failed, try next one
            console.log(`API fetch failed for ${symbol}:`, error.message);
        }
    }
    
    return null;
}

async function refreshAllPrices() {
    if (portfolio.length === 0) {
        showToast('No stocks to refresh', 'info');
        return;
    }
    
    refreshBtn.classList.add('loading');
    let updated = 0;
    let failed = 0;
    
    for (const stock of portfolio) {
        const price = await fetchStockPrice(stock.symbol);
        if (price !== null) {
            stock.currentPrice = price;
            updated++;
        } else {
            failed++;
        }
    }
    
    refreshBtn.classList.remove('loading');
    savePortfolio();
    renderPortfolio();
    
    if (updated > 0 && failed === 0) {
        showToast(`Updated prices for ${updated} stock${updated > 1 ? 's' : ''}`, 'success');
    } else if (updated > 0 && failed > 0) {
        showToast(`Updated ${updated}, couldn't fetch ${failed} prices`, 'info');
    } else {
        showToast('Could not fetch prices. Enter manually or try again later.', 'error');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Portfolio CRUD Operations
// ═══════════════════════════════════════════════════════════════════════════

async function addStock(stockData) {
    const symbol = stockData.symbol.toUpperCase().trim();
    
    // Check if stock already exists
    const existingIndex = portfolio.findIndex(s => s.symbol === symbol);
    
    let currentPrice = stockData.currentPrice;
    
    // Try to fetch current price if not provided
    if (!currentPrice) {
        showToast(`Fetching price for ${symbol}...`, 'info');
        currentPrice = await fetchStockPrice(symbol);
        
        if (!currentPrice) {
            // Use purchase price as fallback
            currentPrice = stockData.purchasePrice;
            showToast(`Could not fetch price for ${symbol}. Using purchase price.`, 'info');
        }
    }
    
    const newStock = {
        symbol: symbol,
        shares: stockData.shares,
        purchasePrice: stockData.purchasePrice,
        currentPrice: currentPrice,
        addedAt: new Date().toISOString()
    };
    
    if (existingIndex >= 0 && !isEditing) {
        // Ask user if they want to average or replace
        if (confirm(`${symbol} already exists. Click OK to add more shares (average cost), or Cancel to replace.`)) {
            // Average the position
            const existing = portfolio[existingIndex];
            const totalShares = existing.shares + newStock.shares;
            const totalCost = (existing.shares * existing.purchasePrice) + (newStock.shares * newStock.purchasePrice);
            existing.shares = totalShares;
            existing.purchasePrice = parseFloat((totalCost / totalShares).toFixed(2));
            existing.currentPrice = newStock.currentPrice;
            showToast(`Averaged position in ${symbol}`, 'success');
        } else {
            portfolio[existingIndex] = newStock;
            showToast(`Replaced position in ${symbol}`, 'success');
        }
    } else if (isEditing && editIndex >= 0) {
        portfolio[editIndex] = newStock;
        showToast(`Updated ${symbol}`, 'success');
    } else {
        portfolio.push(newStock);
        showToast(`Added ${symbol} to portfolio`, 'success');
    }
    
    savePortfolio();
    renderPortfolio();
    resetForm();
}

function deleteStock(index) {
    const stock = portfolio[index];
    if (confirm(`Are you sure you want to remove ${stock.symbol}?`)) {
        portfolio.splice(index, 1);
        savePortfolio();
        renderPortfolio();
        showToast(`Removed ${stock.symbol}`, 'success');
    }
}

function editStock(index) {
    const stock = portfolio[index];
    
    isEditing = true;
    editIndex = index;
    
    symbolInput.value = stock.symbol;
    sharesInput.value = stock.shares;
    purchasePriceInput.value = stock.purchasePrice;
    currentPriceInput.value = stock.currentPrice || '';
    
    formTitle.textContent = `Edit ${stock.symbol}`;
    submitBtn.innerHTML = '<span class="btn-icon">✓</span> Update Stock';
    cancelBtn.style.display = 'inline-flex';
    
    // Scroll to form
    stockForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    symbolInput.focus();
}

function resetForm() {
    stockForm.reset();
    isEditing = false;
    editIndex = -1;
    formTitle.textContent = 'Add New Stock';
    submitBtn.innerHTML = '<span class="btn-icon">+</span> Add Stock';
    cancelBtn.style.display = 'none';
}

// ═══════════════════════════════════════════════════════════════════════════
// Rendering
// ═══════════════════════════════════════════════════════════════════════════

function renderPortfolio() {
    if (portfolio.length === 0) {
        portfolioTable.style.display = 'none';
        emptyState.classList.add('visible');
        updateStats();
        return;
    }
    
    portfolioTable.style.display = 'table';
    emptyState.classList.remove('visible');
    
    portfolioBody.innerHTML = portfolio.map((stock, index) => {
        const investment = stock.shares * stock.purchasePrice;
        const currentValue = stock.shares * (stock.currentPrice || stock.purchasePrice);
        const pnl = currentValue - investment;
        const pnlPercent = ((pnl / investment) * 100).toFixed(2);
        const isPositive = pnl >= 0;
        
        return `
            <tr>
                <td class="symbol">${stock.symbol}</td>
                <td class="shares">${formatNumber(stock.shares)}</td>
                <td class="price">PKR ${formatNumber(stock.purchasePrice)}</td>
                <td class="current-price">PKR ${formatNumber(stock.currentPrice || stock.purchasePrice)}</td>
                <td class="value">PKR ${formatNumber(investment)}</td>
                <td class="value">PKR ${formatNumber(currentValue)}</td>
                <td class="pnl ${isPositive ? 'positive' : 'negative'}">
                    ${isPositive ? '▲' : '▼'} PKR ${formatNumber(Math.abs(pnl))}
                </td>
                <td>
                    <span class="pnl-percent ${isPositive ? 'positive' : 'negative'}">
                        ${isPositive ? '+' : ''}${pnlPercent}%
                    </span>
                </td>
                <td class="actions">
                    <button class="action-btn edit" onclick="editStock(${index})" title="Edit">
                        ✎
                    </button>
                    <button class="action-btn delete" onclick="deleteStock(${index})" title="Delete">
                        ✕
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    updateStats();
}

function updateStats() {
    let totalInvestment = 0;
    let currentValue = 0;
    
    portfolio.forEach(stock => {
        totalInvestment += stock.shares * stock.purchasePrice;
        currentValue += stock.shares * (stock.currentPrice || stock.purchasePrice);
    });
    
    const totalPnl = currentValue - totalInvestment;
    const isPositive = totalPnl >= 0;
    
    totalInvestmentEl.textContent = `PKR ${formatNumber(totalInvestment)}`;
    currentValueEl.textContent = `PKR ${formatNumber(currentValue)}`;
    
    totalPnlEl.textContent = `${isPositive ? '+' : ''}PKR ${formatNumber(totalPnl)}`;
    totalPnlEl.className = `stat-value ${isPositive ? 'positive' : 'negative'}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════

function formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    
    // Format with commas and 2 decimal places
    return parseFloat(num).toLocaleString('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ═══════════════════════════════════════════════════════════════════════════
// Event Listeners
// ═══════════════════════════════════════════════════════════════════════════

stockForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const stockData = {
        symbol: symbolInput.value,
        shares: parseFloat(sharesInput.value),
        purchasePrice: parseFloat(purchasePriceInput.value),
        currentPrice: currentPriceInput.value ? parseFloat(currentPriceInput.value) : null
    };
    
    // Validate
    if (!stockData.symbol || !stockData.shares || !stockData.purchasePrice) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    if (stockData.shares <= 0) {
        showToast('Shares must be greater than 0', 'error');
        return;
    }
    
    if (stockData.purchasePrice <= 0) {
        showToast('Purchase price must be greater than 0', 'error');
        return;
    }
    
    submitBtn.classList.add('loading');
    await addStock(stockData);
    submitBtn.classList.remove('loading');
});

cancelBtn.addEventListener('click', resetForm);

refreshBtn.addEventListener('click', refreshAllPrices);

// Symbol input suggestions
symbolInput.addEventListener('input', (e) => {
    const value = e.target.value.toUpperCase();
    e.target.value = value;
});

// ═══════════════════════════════════════════════════════════════════════════
// Initialization
// ═══════════════════════════════════════════════════════════════════════════

function init() {
    loadPriceCache();
    loadPortfolio();
    renderPortfolio();
    
    console.log('PSXFolio initialized');
    console.log('Portfolio:', portfolio);
}

// Start the app
document.addEventListener('DOMContentLoaded', init);

// Export functions for global access (used by onclick handlers)
window.editStock = editStock;
window.deleteStock = deleteStock;

