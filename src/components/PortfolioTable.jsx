import { formatNumber, formatCurrency, formatPercent } from '../utils/formatters'

export function PortfolioTable({ stocks, onEdit, onDelete, onRefresh, isRefreshing }) {
  if (stocks.length === 0) {
    return (
      <section className="portfolio-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="title-icon">◇</span>
            My Portfolio
          </h2>
        </div>
        
        <div className="empty-state visible">
          <span className="empty-icon">📊</span>
          <p>No stocks in your portfolio yet</p>
          <span className="empty-hint">Add your first stock above to get started</span>
        </div>
      </section>
    )
  }

  return (
    <section className="portfolio-section">
      <div className="section-header">
        <h2 className="section-title">
          <span className="title-icon">◇</span>
          My Portfolio
        </h2>
        <button 
          className={`btn btn-refresh ${isRefreshing ? 'loading' : ''}`}
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh all prices"
        >
          <span className="refresh-icon">↻</span>
          Refresh Prices
        </button>
      </div>

      <div className="table-container">
        <table className="portfolio-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Shares</th>
              <th>Avg. Cost</th>
              <th>Current Price</th>
              <th>Investment</th>
              <th>Current Value</th>
              <th>P&L</th>
              <th>P&L %</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map(stock => {
              const investment = stock.shares * stock.purchasePrice
              const currentValue = stock.shares * (stock.currentPrice || stock.purchasePrice)
              const pnl = currentValue - investment
              const pnlPercent = ((pnl / investment) * 100).toFixed(2)
              const isPositive = pnl >= 0

              return (
                <tr key={stock.id}>
                  <td className="symbol">{stock.symbol}</td>
                  <td className="shares">{formatNumber(stock.shares)}</td>
                  <td className="price">{formatCurrency(stock.purchasePrice)}</td>
                  <td className="current-price">
                    {formatCurrency(stock.currentPrice || stock.purchasePrice)}
                  </td>
                  <td className="value">{formatCurrency(investment)}</td>
                  <td className="value">{formatCurrency(currentValue)}</td>
                  <td className={`pnl ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? '▲' : '▼'} PKR {formatNumber(Math.abs(pnl))}
                  </td>
                  <td>
                    <span className={`pnl-percent ${isPositive ? 'positive' : 'negative'}`}>
                      {formatPercent(pnlPercent)}
                    </span>
                  </td>
                  <td className="actions">
                    <button 
                      className="action-btn edit" 
                      onClick={() => onEdit(stock)}
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button 
                      className="action-btn delete" 
                      onClick={() => onDelete(stock.id)}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

