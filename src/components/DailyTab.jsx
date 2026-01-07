import { useMemo } from 'react'
import { formatCurrency, formatNumber } from '../utils/formatters'

export function DailyTab({ stocks }) {
  // Calculate daily stats for each stock
  const stocksWithDailyStats = useMemo(() => {
    return stocks.map(stock => {
      const priceNow = stock.currentPrice || stock.purchasePrice
      // Only use ldcp if it's a real value (not null/undefined/0)
      const hasValidLdcp = stock.ldcp && stock.ldcp > 0
      const ldcp = hasValidLdcp ? stock.ldcp : null
      const buyingPrice = stock.purchasePrice
      const shares = stock.shares
      const high52w = stock.high52w || null
      const dayLow = stock.dayLow || null
      const dayHigh = stock.dayHigh || null

      // Daily change calculations - only if we have valid LDCP
      const dailyChangePercent = hasValidLdcp ? ((priceNow - ldcp) / ldcp) * 100 : 0
      const dailyChangeAmount = hasValidLdcp ? (priceNow - ldcp) * shares : 0
      const isGainer = dailyChangePercent >= 0

      return {
        ...stock,
        priceNow,
        ldcp,
        hasValidLdcp,
        buyingPrice,
        high52w,
        dayLow,
        dayHigh,
        dailyChangePercent,
        dailyChangeAmount,
        isGainer
      }
    })
  }, [stocks])

  // Calculate total daily P&L - only include stocks with valid LDCP
  const totalDailyPnL = useMemo(() => {
    const validStocks = stocksWithDailyStats.filter(s => s.hasValidLdcp)
    const amount = validStocks.reduce((sum, s) => sum + s.dailyChangeAmount, 0)
    const totalValue = validStocks.reduce((sum, s) => sum + (s.ldcp * s.shares), 0)
    const percent = totalValue > 0 ? (amount / totalValue) * 100 : 0
    return { amount, percent, isPositive: amount >= 0 }
  }, [stocksWithDailyStats])

  // Top Gainers by % - only include stocks with valid LDCP
  const topGainersByPercent = useMemo(() => {
    return [...stocksWithDailyStats]
      .filter(s => s.hasValidLdcp && s.dailyChangePercent > 0)
      .sort((a, b) => b.dailyChangePercent - a.dailyChangePercent)
      .slice(0, 5)
  }, [stocksWithDailyStats])

  // Top Gainers by Amount - only include stocks with valid LDCP
  const topGainersByAmount = useMemo(() => {
    return [...stocksWithDailyStats]
      .filter(s => s.hasValidLdcp && s.dailyChangeAmount > 0)
      .sort((a, b) => b.dailyChangeAmount - a.dailyChangeAmount)
      .slice(0, 5)
  }, [stocksWithDailyStats])

  // Top Losers by % - only include stocks with valid LDCP
  const topLosersByPercent = useMemo(() => {
    return [...stocksWithDailyStats]
      .filter(s => s.hasValidLdcp && s.dailyChangePercent < 0)
      .sort((a, b) => a.dailyChangePercent - b.dailyChangePercent)
      .slice(0, 5)
  }, [stocksWithDailyStats])

  // Top Losers by Amount - only include stocks with valid LDCP
  const topLosersByAmount = useMemo(() => {
    return [...stocksWithDailyStats]
      .filter(s => s.hasValidLdcp && s.dailyChangeAmount < 0)
      .sort((a, b) => a.dailyChangeAmount - b.dailyChangeAmount)
      .slice(0, 5)
  }, [stocksWithDailyStats])

  // 52 Week Droppers - stocks trading below their 52-week high
  const weekDroppers = useMemo(() => {
    return [...stocksWithDailyStats]
      .filter(s => s.high52w && s.priceNow < s.high52w)
      .map(s => ({
        ...s,
        dropFrom52w: ((s.high52w - s.priceNow) / s.high52w) * 100
      }))
      .sort((a, b) => b.dropFrom52w - a.dropFrom52w)
      .slice(0, 5)
  }, [stocksWithDailyStats])

  // Most Volatile - stocks with highest daily range (high - low)
  const mostVolatile = useMemo(() => {
    return [...stocksWithDailyStats]
      .filter(s => s.dayLow && s.dayHigh && s.dayLow > 0)
      .map(s => ({
        ...s,
        volatility: ((s.dayHigh - s.dayLow) / s.dayLow) * 100
      }))
      .sort((a, b) => b.volatility - a.volatility)
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
                <th>LDCP</th>
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
                    <td>{stock.ldcp ? formatNumber(stock.ldcp) : <span className="na-value">N/A</span>}</td>
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
                <th>LDCP</th>
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
                    <td>{stock.ldcp ? formatNumber(stock.ldcp) : <span className="na-value">N/A</span>}</td>
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
                <th>LDCP</th>
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
                    <td>{stock.ldcp ? formatNumber(stock.ldcp) : <span className="na-value">N/A</span>}</td>
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
                <th>LDCP</th>
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
                    <td>{stock.ldcp ? formatNumber(stock.ldcp) : <span className="na-value">N/A</span>}</td>
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

      {/* 52w Droppers and Most Volatile Section */}
      <div className="daily-grid secondary-grid">
        {/* 52w DROPPERS */}
        <div className="daily-section droppers">
          <h3 className="daily-section-title droppers-title">52w DROPPERS</h3>
          <table className="daily-table">
            <thead>
              <tr>
                <th>SYMBOL</th>
                <th>Price now</th>
                <th>LDCP</th>
                <th>Buying Price</th>
                <th>52-Week High</th>
                <th>drop</th>
              </tr>
            </thead>
            <tbody>
              {weekDroppers.length === 0 ? (
                <tr><td colSpan="6" className="no-data">No 52w data available</td></tr>
              ) : (
                weekDroppers.map(stock => (
                  <tr key={stock.symbol} className="dropper-row">
                    <td className="symbol-cell dropper">{stock.symbol}</td>
                    <td>{formatNumber(stock.priceNow)}</td>
                    <td>{stock.ldcp ? formatNumber(stock.ldcp) : <span className="na-value">N/A</span>}</td>
                    <td>{formatNumber(stock.buyingPrice)}</td>
                    <td className="high52w-cell">{formatNumber(stock.high52w)}</td>
                    <td className="drop-cell">{stock.dropFrom52w.toFixed(2)}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MOST VOLATILE */}
        <div className="daily-section volatile">
          <h3 className="daily-section-title volatile-title">MOST VOLATILE (Daily)</h3>
          <table className="daily-table">
            <thead>
              <tr>
                <th>SYMBOL</th>
                <th>low</th>
                <th>high</th>
                <th>volatility</th>
              </tr>
            </thead>
            <tbody>
              {mostVolatile.length === 0 ? (
                <tr><td colSpan="4" className="no-data">N/A</td></tr>
              ) : (
                mostVolatile.map(stock => (
                  <tr key={stock.symbol} className="volatile-row">
                    <td className="symbol-cell volatile">{stock.symbol}</td>
                    <td>{stock.dayLow ? formatNumber(stock.dayLow) : '#N/A'}</td>
                    <td>{stock.dayHigh ? formatNumber(stock.dayHigh) : '#N/A'}</td>
                    <td className="volatility-cell">
                      {stock.volatility ? `${stock.volatility.toFixed(2)}%` : 'N/A'}
                    </td>
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

