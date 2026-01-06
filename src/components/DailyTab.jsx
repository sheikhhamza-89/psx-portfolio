import { useMemo } from 'react'
import { formatCurrency, formatNumber } from '../utils/formatters'

export function DailyTab({ stocks }) {
  // Calculate daily stats for each stock
  const stocksWithDailyStats = useMemo(() => {
    return stocks.map(stock => {
      const priceNow = stock.currentPrice || stock.purchasePrice
      const ldp = stock.ldp || stock.purchasePrice // Last Day Price
      const buyingPrice = stock.purchasePrice
      const shares = stock.shares

      // Daily change calculations
      const dailyChangePercent = ldp > 0 ? ((priceNow - ldp) / ldp) * 100 : 0
      const dailyChangeAmount = (priceNow - ldp) * shares
      const isGainer = dailyChangePercent >= 0

      return {
        ...stock,
        priceNow,
        ldp,
        buyingPrice,
        dailyChangePercent,
        dailyChangeAmount,
        isGainer
      }
    })
  }, [stocks])

  // Calculate total daily P&L
  const totalDailyPnL = useMemo(() => {
    const amount = stocksWithDailyStats.reduce((sum, s) => sum + s.dailyChangeAmount, 0)
    const totalValue = stocksWithDailyStats.reduce((sum, s) => sum + (s.ldp * s.shares), 0)
    const percent = totalValue > 0 ? (amount / totalValue) * 100 : 0
    return { amount, percent, isPositive: amount >= 0 }
  }, [stocksWithDailyStats])

  // Top Gainers by %
  const topGainersByPercent = useMemo(() => {
    return [...stocksWithDailyStats]
      .filter(s => s.dailyChangePercent > 0)
      .sort((a, b) => b.dailyChangePercent - a.dailyChangePercent)
      .slice(0, 5)
  }, [stocksWithDailyStats])

  // Top Gainers by Amount
  const topGainersByAmount = useMemo(() => {
    return [...stocksWithDailyStats]
      .filter(s => s.dailyChangeAmount > 0)
      .sort((a, b) => b.dailyChangeAmount - a.dailyChangeAmount)
      .slice(0, 5)
  }, [stocksWithDailyStats])

  // Top Losers by %
  const topLosersByPercent = useMemo(() => {
    return [...stocksWithDailyStats]
      .filter(s => s.dailyChangePercent < 0)
      .sort((a, b) => a.dailyChangePercent - b.dailyChangePercent)
      .slice(0, 5)
  }, [stocksWithDailyStats])

  // Top Losers by Amount
  const topLosersByAmount = useMemo(() => {
    return [...stocksWithDailyStats]
      .filter(s => s.dailyChangeAmount < 0)
      .sort((a, b) => a.dailyChangeAmount - b.dailyChangeAmount)
      .slice(0, 5)
  }, [stocksWithDailyStats])

  if (stocks.length === 0) {
    return (
      <div className="daily-tab">
        <div className="empty-summary">
          <span className="empty-icon">📈</span>
          <h3>No positions yet</h3>
          <p>Add stocks in the Positions tab to see daily performance</p>
        </div>
      </div>
    )
  }

  return (
    <div className="daily-tab">
      {/* Today's Stats Header */}
      <div className="todays-stats-header">
        <h2 className="stats-title">TODAY'S STATS</h2>
        <div className="stats-subtitle">MY PORTFOLIO</div>
        <div className="stats-row">
          <div className="stat-box">
            <span className="stat-label-daily">P&L AMOUNT #</span>
            <span className={`stat-value-daily ${totalDailyPnL.isPositive ? 'positive' : 'negative'}`}>
              {totalDailyPnL.isPositive ? '' : '-'}{formatNumber(Math.abs(totalDailyPnL.amount))}
            </span>
          </div>
          <div className="stat-box">
            <span className="stat-label-daily">P&L PERCENT %</span>
            <span className={`stat-value-daily ${totalDailyPnL.isPositive ? 'positive' : 'negative'}`}>
              {totalDailyPnL.isPositive ? '▲' : '▼'} {Math.abs(totalDailyPnL.percent).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Gainers and Losers Grid */}
      <div className="daily-grid">
        {/* Top Gainers by % */}
        <div className="daily-section gainers">
          <h3 className="daily-section-title gainers-title">TOP GAINERS (Daily) by %</h3>
          <table className="daily-table">
            <thead>
              <tr>
                <th>SYMBOL</th>
                <th>Price Now</th>
                <th>LDP</th>
                <th>Buying Price</th>
                <th>% up</th>
                <th>Today's gain</th>
              </tr>
            </thead>
            <tbody>
              {topGainersByPercent.length === 0 ? (
                <tr><td colSpan="6" className="no-data">No gainers today</td></tr>
              ) : (
                topGainersByPercent.map(stock => (
                  <tr key={stock.symbol} className="gainer-row">
                    <td className="symbol-cell">{stock.symbol}</td>
                    <td>{formatNumber(stock.priceNow)}</td>
                    <td>{formatNumber(stock.ldp)}</td>
                    <td>{formatNumber(stock.buyingPrice)}</td>
                    <td className="percent-cell positive">▲ {stock.dailyChangePercent.toFixed(2)}%</td>
                    <td className="amount-cell positive">{formatNumber(stock.dailyChangeAmount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Top Gainers by Amount */}
        <div className="daily-section gainers">
          <h3 className="daily-section-title gainers-title">TOP GAINERS (Daily) by Amount</h3>
          <table className="daily-table">
            <thead>
              <tr>
                <th>SYMBOL</th>
                <th>Price Now</th>
                <th>LDP</th>
                <th>Buying Price</th>
                <th>% up</th>
                <th>Today's gain</th>
              </tr>
            </thead>
            <tbody>
              {topGainersByAmount.length === 0 ? (
                <tr><td colSpan="6" className="no-data">No gainers today</td></tr>
              ) : (
                topGainersByAmount.map(stock => (
                  <tr key={stock.symbol} className="gainer-row">
                    <td className="symbol-cell">{stock.symbol}</td>
                    <td>{formatNumber(stock.priceNow)}</td>
                    <td>{formatNumber(stock.ldp)}</td>
                    <td>{formatNumber(stock.buyingPrice)}</td>
                    <td className="percent-cell positive">▲ {stock.dailyChangePercent.toFixed(2)}%</td>
                    <td className="amount-cell positive">{formatNumber(stock.dailyChangeAmount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Top Losers by % */}
        <div className="daily-section losers">
          <h3 className="daily-section-title losers-title">TOP LOSERS (Daily) by %</h3>
          <table className="daily-table">
            <thead>
              <tr>
                <th>SYMBOL</th>
                <th>Price Now</th>
                <th>LDP</th>
                <th>Buying Price</th>
                <th>% down</th>
                <th>Today's loss</th>
              </tr>
            </thead>
            <tbody>
              {topLosersByPercent.length === 0 ? (
                <tr><td colSpan="6" className="no-data">No losers today</td></tr>
              ) : (
                topLosersByPercent.map(stock => (
                  <tr key={stock.symbol} className="loser-row">
                    <td className="symbol-cell">{stock.symbol}</td>
                    <td>{formatNumber(stock.priceNow)}</td>
                    <td>{formatNumber(stock.ldp)}</td>
                    <td>{formatNumber(stock.buyingPrice)}</td>
                    <td className="percent-cell negative">▼ {Math.abs(stock.dailyChangePercent).toFixed(2)}%</td>
                    <td className="amount-cell negative">{formatNumber(stock.dailyChangeAmount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Top Losers by Amount */}
        <div className="daily-section losers">
          <h3 className="daily-section-title losers-title">TOP LOSERS (Daily) by Amount</h3>
          <table className="daily-table">
            <thead>
              <tr>
                <th>SYMBOL</th>
                <th>Price Now</th>
                <th>LDP</th>
                <th>Buying Price</th>
                <th>% down</th>
                <th>Today's loss</th>
              </tr>
            </thead>
            <tbody>
              {topLosersByAmount.length === 0 ? (
                <tr><td colSpan="6" className="no-data">No losers today</td></tr>
              ) : (
                topLosersByAmount.map(stock => (
                  <tr key={stock.symbol} className="loser-row">
                    <td className="symbol-cell">{stock.symbol}</td>
                    <td>{formatNumber(stock.priceNow)}</td>
                    <td>{formatNumber(stock.ldp)}</td>
                    <td>{formatNumber(stock.buyingPrice)}</td>
                    <td className="percent-cell negative">▼ {Math.abs(stock.dailyChangePercent).toFixed(2)}%</td>
                    <td className="amount-cell negative">{formatNumber(stock.dailyChangeAmount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

