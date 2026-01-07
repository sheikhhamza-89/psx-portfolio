import { useState, useEffect, useMemo } from 'react'
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters'
import * as supabaseService from '../services/supabaseService'
import { isSupabaseConfigured } from '../lib/supabase'

export function ClosedPositionsTab({ onClosedPositionsChange }) {
  const [closedPositions, setClosedPositions] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Load closed positions from transactions
  useEffect(() => {
    async function loadClosedPositions() {
      if (isSupabaseConfigured()) {
        const data = await supabaseService.getClosedPositions()
        if (data) {
          setClosedPositions(data)
          onClosedPositionsChange?.(data)
        }
      }
      setIsLoading(false)
    }
    loadClosedPositions()
  }, [onClosedPositionsChange])

  // Calculate totals
  const totals = useMemo(() => {
    const totalBought = closedPositions.reduce((sum, p) => sum + p.totalBoughtAmount, 0)
    const totalSold = closedPositions.reduce((sum, p) => sum + p.totalSoldAmount, 0)
    const totalPnl = closedPositions.reduce((sum, p) => sum + p.realizedPnl, 0)
    const totalShares = closedPositions.reduce((sum, p) => sum + p.totalSharesBought, 0)
    const profitableCount = closedPositions.filter(p => p.realizedPnl > 0).length
    const lossCount = closedPositions.filter(p => p.realizedPnl < 0).length

    return {
      totalBought,
      totalSold,
      totalPnl,
      totalShares,
      profitableCount,
      lossCount,
      isPositive: totalPnl >= 0,
      pnlPercent: totalBought > 0 ? (totalPnl / totalBought) * 100 : 0
    }
  }, [closedPositions])

  if (!isSupabaseConfigured()) {
    return (
      <div className="closed-positions-tab">
        <div className="empty-summary">
          <span className="empty-icon">✓</span>
          <h3>Supabase Required</h3>
          <p>Closed positions tracking requires Supabase connection</p>
        </div>
      </div>
    )
  }

  return (
    <div className="closed-positions-tab">
      {/* Summary Cards */}
      <div className="metrics-grid closed-metrics">
        <div className={`metric-card ${totals.isPositive ? 'gain' : 'loss'}`}>
          <span className="metric-label">Realized P&L</span>
          <span className="metric-value">
            {totals.isPositive ? '+' : ''}{formatCurrency(totals.totalPnl)}
          </span>
          <span className="metric-subvalue">
            {formatPercent(totals.pnlPercent)}
          </span>
        </div>

        <div className="metric-card primary">
          <span className="metric-label">Total Invested</span>
          <span className="metric-value">{formatCurrency(totals.totalBought)}</span>
          <span className="metric-subvalue">in closed positions</span>
        </div>

        <div className="metric-card primary">
          <span className="metric-label">Total Received</span>
          <span className="metric-value">{formatCurrency(totals.totalSold)}</span>
          <span className="metric-subvalue">from sales</span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Closed Positions</span>
          <span className="metric-value">{closedPositions.length}</span>
          <span className="metric-subvalue">
            {totals.profitableCount} profitable, {totals.lossCount} loss
          </span>
        </div>
      </div>

      {/* Closed Positions Table */}
      <section className="portfolio-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="title-icon">✓</span>
            Closed Positions
          </h2>
        </div>

        {isLoading ? (
          <div className="loading-state">Loading closed positions...</div>
        ) : closedPositions.length === 0 ? (
          <div className="empty-state visible">
            <span className="empty-icon">📈</span>
            <p>No closed positions yet</p>
            <span className="empty-hint">Positions appear here when all shares are sold</span>
          </div>
        ) : (
          <div className="table-container">
            <table className="portfolio-table closed-positions-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Shares Traded</th>
                  <th>Avg. Buy Price</th>
                  <th>Avg. Sell Price</th>
                  <th>Total Invested</th>
                  <th>Total Received</th>
                  <th>Realized P&L</th>
                  <th>P&L %</th>
                </tr>
              </thead>
              <tbody>
                {closedPositions.map(position => (
                  <tr key={position.symbol}>
                    <td className="symbol">
                      <span className="symbol-closed">{position.symbol}</span>
                    </td>
                    <td className="shares">{formatNumber(position.totalSharesBought)}</td>
                    <td className="price">{formatCurrency(position.avgBuyPrice)}</td>
                    <td className="price">{formatCurrency(position.avgSellPrice)}</td>
                    <td className="value">{formatCurrency(position.totalBoughtAmount)}</td>
                    <td className="value">{formatCurrency(position.totalSoldAmount)}</td>
                    <td className={`pnl ${position.realizedPnl >= 0 ? 'positive' : 'negative'}`}>
                      {position.realizedPnl >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(position.realizedPnl))}
                    </td>
                    <td>
                      <span className={`pnl-percent ${position.realizedPnl >= 0 ? 'positive' : 'negative'}`}>
                        {formatPercent(position.pnlPercent)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

