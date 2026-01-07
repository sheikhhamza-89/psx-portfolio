import { useMemo } from 'react'
import { formatCurrency, formatPercent } from '../utils/formatters'
import { calculatePortfolioXIRR } from '../utils/xirr'
import { PortfolioCharts } from './PortfolioCharts'
import { STOCK_CATEGORIES } from '../utils/constants'

export function SummaryTab({ stocks, stats, totalDividends = 0, realizedPnl = 0 }) {
  const { totalInvestment, currentValue, totalPnl, totalPnlPercent, isPositive } = stats
  
  // Unrealized P&L (from active positions)
  const unrealizedPnl = totalPnl
  
  // Total P&L = Unrealized (active) + Realized (closed) + Dividends
  const totalGain = unrealizedPnl + realizedPnl + totalDividends
  const totalGainPercent = totalInvestment > 0 
    ? ((totalGain / totalInvestment) * 100) 
    : 0
  const isTotalGainPositive = totalGain >= 0
  
  // Calculate gain with and without dividends (legacy - for backwards compatibility)
  const gainWithDividends = totalPnl + totalDividends
  const gainPercentWithDividends = totalInvestment > 0 
    ? ((gainWithDividends / totalInvestment) * 100) 
    : 0
  const isGainPositive = gainWithDividends >= 0

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

  // Find top gainers and losers (top 3 each)
  const stocksWithPnl = useMemo(() => {
    return stocks.map(s => {
      const investment = s.shares * s.purchasePrice
      const current = s.shares * (s.currentPrice || s.purchasePrice)
      const pnl = current - investment
      const pnlPercent = investment > 0 ? (pnl / investment) * 100 : 0
      return { ...s, pnl, pnlPercent }
    }).sort((a, b) => b.pnlPercent - a.pnlPercent)
  }, [stocks])

  // Top 3 gainers (positive P&L, sorted by highest %)
  const topGainers = useMemo(() => {
    return stocksWithPnl.filter(s => s.pnl > 0).slice(0, 3)
  }, [stocksWithPnl])

  // Top 3 losers (negative P&L, sorted by lowest %)
  const topLosers = useMemo(() => {
    return stocksWithPnl.filter(s => s.pnl < 0).slice(-3).reverse()
  }, [stocksWithPnl])

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

          {/* Gain / Loss Summary */}
          <div className="gain-loss-summary-section">
            <h3 className="section-subtitle">
              <span className="subtitle-icon">📈</span>
              Gain / Loss Summary
            </h3>
            <div className="metrics-grid gain-loss-grid">
              <div className={`metric-card ${isTotalGainPositive ? 'gain' : 'loss'}`}>
                <span className="metric-label">Total Gain/Loss</span>
                <span className="metric-value">
                  {isTotalGainPositive ? '+' : ''}{formatCurrency(totalGain)}
                </span>
                <span className="metric-subvalue">
                  {formatPercent(totalGainPercent)} (all sources)
                </span>
              </div>

              <div className={`metric-card ${unrealizedPnl >= 0 ? 'gain' : 'loss'}`}>
                <span className="metric-label">Unrealized P&L</span>
                <span className="metric-value">
                  {unrealizedPnl >= 0 ? '+' : ''}{formatCurrency(unrealizedPnl)}
                </span>
                <span className="metric-subvalue">active positions</span>
              </div>

              <div className={`metric-card ${realizedPnl >= 0 ? 'gain' : 'loss'}`}>
                <span className="metric-label">Realized P&L</span>
                <span className="metric-value">
                  {realizedPnl >= 0 ? '+' : ''}{formatCurrency(realizedPnl)}
                </span>
                <span className="metric-subvalue">closed positions</span>
              </div>

              <div className="metric-card gain">
                <span className="metric-label">Dividends Received</span>
                <span className="metric-value">
                  +{formatCurrency(totalDividends)}
                </span>
                <span className="metric-subvalue">income earned</span>
              </div>
            </div>
          </div>

          {/* Top Gainers & Losers */}
          {stocks.length >= 2 && (topGainers.length > 0 || topLosers.length > 0) && (
            <div className="performers-section">
              <h3 className="section-subtitle">
                <span className="subtitle-icon">★</span>
                Top Performers
              </h3>
              
              <div className="performers-columns">
                {/* Top Gainers */}
                {topGainers.length > 0 && (
                  <div className="performers-column gainers">
                    <h4 className="performers-column-title">
                      <span className="column-icon">▲</span>
                      Top Gainers
                    </h4>
                    <div className="performers-list">
                      {topGainers.map((stock, index) => (
                        <div key={stock.symbol} className="performer-card best">
                          <div className="performer-rank">#{index + 1}</div>
                          <div className="performer-header">
                            <span className="performer-symbol">{stock.symbol}</span>
                            <span className={`category-badge ${stock.category || 'other'}`}>
                              {getCategoryLabel(stock.category)}
                            </span>
                          </div>
                          <div className="performer-stats">
                            <span className="performer-pnl positive">
                              +{formatCurrency(stock.pnl)}
                            </span>
                            <span className="performer-percent positive">
                              {formatPercent(stock.pnlPercent)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Losers */}
                {topLosers.length > 0 && (
                  <div className="performers-column losers">
                    <h4 className="performers-column-title">
                      <span className="column-icon">▼</span>
                      Top Losers
                    </h4>
                    <div className="performers-list">
                      {topLosers.map((stock, index) => (
                        <div key={stock.symbol} className="performer-card worst">
                          <div className="performer-rank">#{index + 1}</div>
                          <div className="performer-header">
                            <span className="performer-symbol">{stock.symbol}</span>
                            <span className={`category-badge ${stock.category || 'other'}`}>
                              {getCategoryLabel(stock.category)}
                            </span>
                          </div>
                          <div className="performer-stats">
                            <span className="performer-pnl negative">
                              {formatCurrency(stock.pnl)}
                            </span>
                            <span className="performer-percent negative">
                              {formatPercent(stock.pnlPercent)}
                            </span>
                          </div>
                        </div>
                      ))}
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
