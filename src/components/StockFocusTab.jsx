import { useState, useMemo, useEffect } from 'react'
import { formatCurrency, formatPercent } from '../utils/formatters'
import * as supabaseService from '../services/supabaseService'
import { isSupabaseConfigured } from '../lib/supabase'

export function StockFocusTab({ stocks }) {
  const [selectedSymbol, setSelectedSymbol] = useState('')
  const [stockDividends, setStockDividends] = useState(0)

  // Get selected stock data
  const selectedStock = useMemo(() => {
    if (!selectedSymbol) return null
    return stocks.find(s => s.symbol === selectedSymbol)
  }, [selectedSymbol, stocks])

  // Fetch dividends for selected stock
  useEffect(() => {
    async function fetchDividends() {
      if (selectedSymbol && isSupabaseConfigured()) {
        const total = await supabaseService.getTotalDividendsBySymbol(selectedSymbol)
        setStockDividends(total)
      } else {
        setStockDividends(0)
      }
    }
    fetchDividends()
  }, [selectedSymbol])

  // Calculate earnings for selected stock
  const earnings = useMemo(() => {
    if (!selectedStock) return null

    const { shares, purchasePrice, currentPrice, ldp, transactions = [] } = selectedStock
    const price = currentPrice || purchasePrice

    // Unrealized Gain/Loss
    const currentHoldingValue = shares * price
    const currentHoldingCost = shares * purchasePrice
    const gainLossCurrentHolding = currentHoldingValue - currentHoldingCost
    const gainLossCurrentHoldingPercent = currentHoldingCost > 0 
      ? (gainLossCurrentHolding / currentHoldingCost) * 100 
      : 0

    // Gain/Loss Today (based on LDP)
    const gainLossToday = ldp && price ? (price - ldp) * shares : 0
    const gainLossTodayPercent = ldp && ldp > 0 ? ((price - ldp) / ldp) * 100 : 0

    // Realized Gain/Loss from sell transactions
    let realizedCapitalGain = 0
    let totalSoldShares = 0
    let totalSoldValue = 0

    transactions.forEach(tx => {
      if (tx.type === 'sell') {
        const soldValue = tx.shares * tx.price
        const costBasis = tx.shares * purchasePrice // Simplified: using avg purchase price
        realizedCapitalGain += (soldValue - costBasis)
        totalSoldShares += tx.shares
        totalSoldValue += soldValue
      }
    })

    // Use actual dividend data from Supabase
    const realizedDividend = stockDividends

    // Overall calculations
    const overallWithoutDividend = gainLossCurrentHolding + realizedCapitalGain
    const overallWithDividend = overallWithoutDividend + realizedDividend
    
    const totalInvested = (shares + totalSoldShares) * purchasePrice
    const overallPercentWithoutDividend = totalInvested > 0 
      ? (overallWithoutDividend / totalInvested) * 100 
      : 0
    const overallPercentWithDividend = totalInvested > 0 
      ? (overallWithDividend / totalInvested) * 100 
      : 0

    return {
      // Unrealized
      gainLossToday,
      gainLossTodayPercent,
      gainLossCurrentHolding,
      gainLossCurrentHoldingPercent,
      // Realized
      realizedDividend,
      realizedCapitalGain,
      // Overall
      overallWithoutDividend,
      overallPercentWithoutDividend,
      overallWithDividend,
      overallPercentWithDividend,
      // Additional info
      currentHoldingValue,
      currentHoldingCost,
      totalSoldShares,
      totalSoldValue
    }
  }, [selectedStock, stockDividends])

  if (stocks.length === 0) {
    return (
      <div className="stock-focus-tab">
        <div className="empty-summary">
          <span className="empty-icon">🔍</span>
          <h3>No stocks to analyze</h3>
          <p>Add stocks in the Positions tab first</p>
        </div>
      </div>
    )
  }

  return (
    <div className="stock-focus-tab">
      {/* Stock Selector */}
      <div className="focus-selector">
        <label htmlFor="stock-select">Select Stock to Analyze</label>
        <select
          id="stock-select"
          value={selectedSymbol}
          onChange={(e) => setSelectedSymbol(e.target.value)}
        >
          <option value="">-- Choose a Stock --</option>
          {stocks.map(stock => (
            <option key={stock.symbol} value={stock.symbol}>
              {stock.symbol} - {stock.category} ({stock.shares} shares)
            </option>
          ))}
        </select>
      </div>

      {selectedStock && earnings && (
        <>
          {/* Stock Header */}
          <div className="focus-header">
            <h2 className="focus-symbol">{selectedStock.symbol}</h2>
            <span className="focus-category">{selectedStock.category}</span>
            <div className="focus-price">
              <span className="current-price">{formatCurrency(selectedStock.currentPrice || selectedStock.purchasePrice)}</span>
              {selectedStock.ldp && (
                <span className={`price-change ${earnings.gainLossToday >= 0 ? 'positive' : 'negative'}`}>
                  {earnings.gainLossToday >= 0 ? '▲' : '▼'} {formatPercent(Math.abs(earnings.gainLossTodayPercent))}
                </span>
              )}
            </div>
          </div>

          {/* Earnings Dashboard */}
          <div className="earnings-dashboard">
            <h3 className="earnings-title">Earnings</h3>

            <div className="earnings-grid">
              {/* Unrealized Gain/Loss */}
              <div className="earnings-section unrealized">
                <h4 className="section-label">Overall Unrealized Gain/Loss</h4>
                <div className="metrics-row">
                  <div className="metric">
                    <span className="metric-label">Gain/Loss Today</span>
                    <span className={`metric-value ${earnings.gainLossToday >= 0 ? 'positive' : 'negative'}`}>
                      {formatCurrency(earnings.gainLossToday)}
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Gain/Loss (Current Holding)</span>
                    <span className={`metric-value ${earnings.gainLossCurrentHolding >= 0 ? 'positive' : 'negative'}`}>
                      {formatCurrency(earnings.gainLossCurrentHolding)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Realized Gain/Loss */}
              <div className="earnings-section realized">
                <h4 className="section-label">Overall Realized Gain/Loss</h4>
                <div className="metrics-row">
                  <div className="metric">
                    <span className="metric-label">Realized Gain/Loss Dividend</span>
                    <span className="metric-value">
                      {formatCurrency(earnings.realizedDividend)}
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Realized Gain/Loss Capital</span>
                    <span className={`metric-value ${earnings.realizedCapitalGain >= 0 ? 'positive' : 'negative'}`}>
                      {formatCurrency(earnings.realizedCapitalGain)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Overall Without Dividend */}
              <div className="earnings-section overall-no-div">
                <h4 className="section-label">OVERALL GAIN/LOSS Without Dividend</h4>
                <div className="metrics-row">
                  <div className="metric">
                    <span className="metric-label">Amount</span>
                    <span className={`metric-value large ${earnings.overallWithoutDividend >= 0 ? 'positive' : 'negative'}`}>
                      {formatCurrency(earnings.overallWithoutDividend)}
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Percentage</span>
                    <span className={`metric-value large ${earnings.overallPercentWithoutDividend >= 0 ? 'positive' : 'negative'}`}>
                      {formatPercent(earnings.overallPercentWithoutDividend)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Overall With Dividend */}
              <div className="earnings-section overall-total">
                <h4 className="section-label">OVERALL GAIN/LOSS</h4>
                <div className="metrics-row">
                  <div className="metric">
                    <span className="metric-label">Amount</span>
                    <span className={`metric-value large ${earnings.overallWithDividend >= 0 ? 'positive' : 'negative'}`}>
                      {formatCurrency(earnings.overallWithDividend)}
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Percentage</span>
                    <span className={`metric-value large ${earnings.overallPercentWithDividend >= 0 ? 'positive' : 'negative'}`}>
                      {formatPercent(earnings.overallPercentWithDividend)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Position Details */}
            <div className="position-details">
              <h4>Position Details</h4>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Shares Held</span>
                  <span className="detail-value">{selectedStock.shares.toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Avg. Cost</span>
                  <span className="detail-value">{formatCurrency(selectedStock.purchasePrice)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Current Price</span>
                  <span className="detail-value">{formatCurrency(selectedStock.currentPrice || selectedStock.purchasePrice)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Total Cost</span>
                  <span className="detail-value">{formatCurrency(earnings.currentHoldingCost)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Current Value</span>
                  <span className="detail-value">{formatCurrency(earnings.currentHoldingValue)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Shares Sold</span>
                  <span className="detail-value">{earnings.totalSoldShares.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {!selectedSymbol && (
        <div className="focus-placeholder">
          <span className="placeholder-icon">📊</span>
          <p>Select a stock above to view detailed earnings analysis</p>
        </div>
      )}
    </div>
  )
}

