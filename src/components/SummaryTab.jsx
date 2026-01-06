import { useMemo } from 'react'
import { formatCurrency, formatPercent } from '../utils/formatters'
import { calculatePortfolioXIRR } from '../utils/xirr'
import { PortfolioCharts } from './PortfolioCharts'
import { STOCK_CATEGORIES } from '../utils/constants'

export function SummaryTab({ stocks, stats }) {
  const { totalInvestment, currentValue, totalPnl, totalPnlPercent, isPositive } = stats

  // Calculate additional metrics
  const stockCount = stocks.length
  const gainers = stocks.filter(s => {
    const pnl = (s.currentPrice || s.purchasePrice) - s.purchasePrice
    return pnl > 0
  }).length
  const losers = stocks.filter(s => {
    const pnl = (s.currentPrice || s.purchasePrice) - s.purchasePrice
    return pnl < 0
  }).length

  // Calculate XIRR
  const xirr = useMemo(() => {
    return calculatePortfolioXIRR(stocks)
  }, [stocks])

  // Count unique categories
  const categoryCount = useMemo(() => {
    return new Set(stocks.map(s => s.category).filter(Boolean)).size
  }, [stocks])

  // Find best and worst performers
  const stocksWithPnl = stocks.map(s => {
    const investment = s.shares * s.purchasePrice
    const current = s.shares * (s.currentPrice || s.purchasePrice)
    const pnl = current - investment
    const pnlPercent = investment > 0 ? (pnl / investment) * 100 : 0
    return { ...s, pnl, pnlPercent }
  }).sort((a, b) => b.pnlPercent - a.pnlPercent)

  const bestPerformer = stocksWithPnl[0]
  const worstPerformer = stocksWithPnl[stocksWithPnl.length - 1]

  // Get category label
  const getCategoryLabel = (value) => {
    const cat = STOCK_CATEGORIES.find(c => c.value === value)
    return cat ? cat.label : value || '—'
  }

  return (
    <div className="summary-tab">
      {stocks.length === 0 ? (
        <div className="empty-summary">
          <span className="empty-icon">📊</span>
          <h3>No positions yet</h3>
          <p>Add your first stock in the Positions tab to see your portfolio summary</p>
        </div>
      ) : (
        <>
          {/* Key Metrics Cards */}
          <div className="metrics-grid">
            <div className="metric-card primary">
              <span className="metric-label">Total Investment</span>
              <span className="metric-value">{formatCurrency(totalInvestment)}</span>
            </div>
            
            <div className="metric-card primary">
              <span className="metric-label">Current Value</span>
              <span className="metric-value">{formatCurrency(currentValue)}</span>
            </div>
            
            <div className={`metric-card ${isPositive ? 'gain' : 'loss'}`}>
              <span className="metric-label">Total P&L</span>
              <span className="metric-value">
                {isPositive ? '+' : ''}{formatCurrency(totalPnl)}
              </span>
              <span className="metric-subvalue">
                {formatPercent(totalPnlPercent)}
              </span>
            </div>

            <div className={`metric-card xirr ${xirr !== null && xirr >= 0 ? 'gain' : 'loss'}`}>
              <span className="metric-label">XIRR</span>
              <span className="metric-value">
                {xirr !== null ? `${xirr >= 0 ? '+' : ''}${xirr.toFixed(2)}%` : '—'}
              </span>
              <span className="metric-subvalue">annualized return</span>
            </div>

            <div className="metric-card">
              <span className="metric-label">Holdings</span>
              <span className="metric-value">{stockCount}</span>
              <span className="metric-subvalue">{categoryCount} categories</span>
            </div>

            <div className="metric-card gain-count">
              <span className="metric-label">Gainers</span>
              <span className="metric-value">{gainers}</span>
              <span className="metric-subvalue">▲ in profit</span>
            </div>

            <div className="metric-card loss-count">
              <span className="metric-label">Losers</span>
              <span className="metric-value">{losers}</span>
              <span className="metric-subvalue">▼ in loss</span>
            </div>
          </div>

          {/* Best & Worst Performers */}
          {stocks.length >= 2 && (
            <div className="performers-section">
              <h3 className="section-subtitle">
                <span className="subtitle-icon">★</span>
                Top Performers
              </h3>
              <div className="performers-grid">
                {bestPerformer && (
                  <div className="performer-card best">
                    <div className="performer-header">
                      <span className="performer-badge">Best</span>
                      <span className="performer-symbol">{bestPerformer.symbol}</span>
                      <span className={`category-badge ${bestPerformer.category || 'other'}`}>
                        {getCategoryLabel(bestPerformer.category)}
                      </span>
                    </div>
                    <div className="performer-stats">
                      <span className={`performer-pnl ${bestPerformer.pnl >= 0 ? 'positive' : 'negative'}`}>
                        {bestPerformer.pnl >= 0 ? '+' : ''}{formatCurrency(bestPerformer.pnl)}
                      </span>
                      <span className={`performer-percent ${bestPerformer.pnlPercent >= 0 ? 'positive' : 'negative'}`}>
                        {formatPercent(bestPerformer.pnlPercent)}
                      </span>
                    </div>
                  </div>
                )}
                
                {worstPerformer && worstPerformer.symbol !== bestPerformer?.symbol && (
                  <div className="performer-card worst">
                    <div className="performer-header">
                      <span className="performer-badge">Worst</span>
                      <span className="performer-symbol">{worstPerformer.symbol}</span>
                      <span className={`category-badge ${worstPerformer.category || 'other'}`}>
                        {getCategoryLabel(worstPerformer.category)}
                      </span>
                    </div>
                    <div className="performer-stats">
                      <span className={`performer-pnl ${worstPerformer.pnl >= 0 ? 'positive' : 'negative'}`}>
                        {worstPerformer.pnl >= 0 ? '+' : ''}{formatCurrency(worstPerformer.pnl)}
                      </span>
                      <span className={`performer-percent ${worstPerformer.pnlPercent >= 0 ? 'positive' : 'negative'}`}>
                        {formatPercent(worstPerformer.pnlPercent)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Charts */}
          <PortfolioCharts stocks={stocks} />
        </>
      )}
    </div>
  )
}
